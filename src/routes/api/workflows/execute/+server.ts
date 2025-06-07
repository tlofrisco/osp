import { json, error } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabaseAdmin';

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

    // For now, we'll simulate workflow execution since Temporal integration needs setup
    // In production, this would start a Temporal workflow
    console.log('Workflow definition:', workflowDef);
    
    // Simulate workflow execution
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
      console.error('Failed to store workflow execution:', {
        error: insertError,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code
      });
      // Don't fail the request, just log the warning
    } else {
      console.log('✅ Workflow execution stored:', executionData);
    }

    // Execute workflow steps
    try {
      // Process each step in the workflow
      for (const step of workflowDef.steps || []) {
        console.log(`📍 Executing step: ${step.name} (${step.type})`);
        
        // Handle create_entity steps
        if (step.type === 'create_entity' && step.target_entity) {
          const entityName = step.target_entity.toLowerCase();
          const tableName = `${serviceSchema}.${entityName}`;
          
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
          }
          
          console.log(`💾 Creating ${entityName}:`, entityData);
          
          // Insert the entity
          const { data: createdEntity, error: createError } = await supabaseAdmin
            .from(tableName)
            .insert(entityData)
            .select()
            .single();
          
          if (createError) {
            console.error(`Failed to create ${entityName}:`, createError);
            throw new Error(`Failed to create ${entityName}: ${createError.message}`);
          }
          
          console.log(`✅ Created ${entityName}:`, createdEntity);
        }
        
        // Handle other step types as needed
        // TODO: Implement validate, check_availability, send_notification, etc.
      }
      
      // Update workflow execution status to completed
      await supabaseAdmin
        .from('workflow_executions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          output: { message: 'Workflow completed successfully' }
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
      message: `${workflowDef.name} started successfully`
    });

  } catch (err) {
    console.error('Workflow execution error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    throw error(500, `Failed to execute workflow: ${message}`);
  }
} 