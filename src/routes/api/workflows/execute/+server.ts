import { json, error } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabaseAdmin';
import { createTemporalClient, generateTaskQueue } from '$lib/temporal/client';

export async function POST({ request, locals }: RequestEvent) {
  const supabase = locals.supabase;
  const sessionResult = locals.session;
  
  if (!sessionResult) {
    throw error(401, 'Unauthorized - No active session detected.');
  }

  // Extract user from the session structure
  const session = sessionResult.data?.session;
  const user = sessionResult.data?.user || session?.user;

  if (!user?.id) {
    throw error(401, 'No user found in session');
  }

  try {
    const { workflowId, serviceSchema, workflowDefinition, input = {} } = await request.json();
    
    if (!workflowId || !serviceSchema) {
      throw error(400, 'Missing required parameters: workflowId and serviceSchema');
    }

    console.log(`🚀 Executing workflow ${workflowId} for service ${serviceSchema}`);

    // Use the workflow definition passed from the UI, or fetch from service if not provided
    let workflowDef = workflowDefinition;
    
    if (!workflowDef) {
      // Fallback: Get the workflow definition from the service
      const { data: service, error: serviceError } = await supabaseAdmin
        .from('services')
        .select('metadata')
        .eq('service_schema', serviceSchema)
        .single();

      if (serviceError || !service) {
        throw error(404, `Service not found: ${serviceSchema}`);
      }

      const workflows = service.metadata?.workflows || [];
      workflowDef = workflows.find((w: any) => w.id === workflowId);
      
      if (!workflowDef) {
        throw error(404, `Workflow not found: ${workflowId}`);
      }
    }

    // 🔥 ACTIVATE TEMPORAL INTEGRATION
    console.log('🌐 Attempting to start workflow in Temporal Cloud...');
    
    try {
      // Create Temporal client
      const client = await createTemporalClient();
      
      // Generate unique workflow ID
      const executionId = `${serviceSchema}-${workflowId}-${Date.now()}`;
      const taskQueue = generateTaskQueue(serviceSchema);
      
      console.log(`📋 Task Queue: ${taskQueue}`);
      console.log(`🆔 Execution ID: ${executionId}`);
      
      // Map workflow ID to manifest naming convention
      const workflowTypeMap: Record<string, string> = {
        'create_reservation_workflow': 'createReservation',
        'cancel_reservation_workflow': 'cancelReservation', 
        'process_payment_workflow': 'processPayment'
      };
      
      const workflowType = workflowTypeMap[workflowDef.id] || workflowDef.id;
      console.log(`🎯 Mapped workflow: ${workflowDef.id} → ${workflowType}`);
      
      // Start the workflow in Temporal Cloud
      const workflowHandle = await client.workflow.start(workflowType, {
        workflowId: executionId,
        taskQueue: taskQueue,
        args: [input],
      });

      console.log(`✅ Temporal workflow started: ${workflowHandle.workflowId}`);

      // Store execution record
      const { data: executionData, error: insertError } = await supabaseAdmin
        .from('workflow_executions')
        .insert({
          workflow_id: workflowId,
          execution_id: executionId,
          service_schema: serviceSchema,
          user_id: user.id,
          status: 'running',
          input: input,
          workflow_definition: workflowDef,
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) {
        console.warn('Failed to store workflow execution:', insertError);
      } else {
        console.log('✅ Workflow execution stored:', executionData?.id);
      }

      return json({
        success: true,
        executionId: executionId,
        temporalWorkflowId: workflowHandle.workflowId,
        taskQueue: taskQueue,
        message: `${workflowDef.name} started in Temporal Cloud`,
        mode: 'temporal'
      });

    } catch (temporalError) {
      console.error('❌ Temporal execution failed, falling back to simulation:', temporalError);
      
      // Fall back to existing simulation code if Temporal fails
      const executionId = `${workflowId}-${Date.now()}`;
      
      // Store workflow execution record
      const { data: executionData, error: insertError } = await supabaseAdmin
        .from('workflow_executions')
        .insert({
          workflow_id: workflowId,
          execution_id: executionId,
          service_schema: serviceSchema,
          user_id: user.id,
          status: 'running',
          input: input,
          workflow_definition: workflowDef,
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) {
        console.error('Failed to store workflow execution:', insertError);
      }

      // Execute workflow steps (simulation)
      try {
        // Process each step in the workflow
        for (const step of workflowDef.steps || []) {
          console.log(`📍 Executing step: ${step.name} (${step.type})`);
          
          // Handle create_entity steps
          if (step.type === 'create_entity' && step.target_entity) {
            const entityName = step.target_entity.toLowerCase();
            
            // Generate a unique ID for the new entity
            const entityId = `${entityName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            // Prepare entity data based on input and step configuration
            const entityData: any = {
              id: entityId,
              workflow_state: 'created',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            
            // Map input fields to entity fields
            if (step.uses_fields && Array.isArray(step.uses_fields)) {
              for (const field of step.uses_fields) {
                if (input[field] !== undefined) {
                  entityData[field] = input[field];
                }
              }
            }
            
            // Add default values for common fields
            if (step.target_entity === 'Reservation') {
              entityData.status = entityData.status || 'pending';
              entityData.workflow_state = 'pending_confirmation';
              
              // TEMPORARY: Add test data only if input is completely empty
              if (Object.keys(input).length === 0) {
                console.warn('⚠️ No input provided - using test data for workflow testing');
                entityData.customer_name = 'Test Customer ' + Date.now();
                entityData.phone_number = '555-' + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
                entityData.reservation_date = new Date().toISOString();
                entityData.reservation_time = '19:00';
                entityData.party_size = 2;
                entityData.table_number = Math.floor(Math.random() * 20) + 1;
                entityData.special_requests = 'TEST DATA - Remove after testing';
              }
            }
            
            console.log(`💾 Creating ${entityName} in schema ${serviceSchema}:`, entityData);
            
            // Insert the entity using RPC function to bypass schema restrictions
            const { data: insertResult, error: createError } = await supabaseAdmin
              .rpc('insert_into_dynamic_table', {
                in_schema_name: serviceSchema,
                in_table_name: entityName,
                json_data: entityData
              });
            
            if (createError) {
              console.error(`Failed to create ${entityName}:`, createError);
              throw new Error(`Failed to create ${entityName}: ${createError.message}`);
            }
            
            console.log(`✅ Created ${entityName} via RPC:`, insertResult);
          }
        }
        
        // Update workflow execution status to completed
        await supabaseAdmin
          .from('workflow_executions')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            output: { message: 'Workflow completed successfully (simulation mode)' }
          })
          .eq('execution_id', executionId);
          
      } catch (stepError) {
        console.error('Workflow step execution failed:', stepError);
        
        // Update workflow execution status to failed
        await supabaseAdmin
          .from('workflow_executions')
          .update({
            status: 'failed',
            completed_at: new Date().toISOString(),
            error: stepError instanceof Error ? stepError.message : 'Unknown error'
          })
          .eq('execution_id', executionId);
          
        throw stepError;
      }

      return json({
        success: true,
        executionId: executionId,
        message: `${workflowDef.name} started successfully (simulation mode)`,
        mode: 'simulation',
        warning: 'Temporal Cloud unavailable, executed in simulation mode'
      });
    }

  } catch (err) {
    console.error('Workflow execution error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    throw error(500, `Failed to execute workflow: ${message}`);
  }
} 