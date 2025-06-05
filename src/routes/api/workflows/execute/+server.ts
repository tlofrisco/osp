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
    const { error: insertError } = await supabaseAdmin
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
      });

    if (insertError) {
      console.warn('Failed to store workflow execution:', insertError);
      // Don't fail the request, just log the warning
    }

    // Simulate workflow steps execution
    setTimeout(async () => {
      // Update status to completed after 5 seconds (simulation)
      await supabaseAdmin
        .from('workflow_executions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('execution_id', executionId);
    }, 5000);

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