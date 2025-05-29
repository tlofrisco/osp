// src/routes/api/agent/loop/+server.ts
import { json } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabaseAdmin';
import { collectErrorContext } from '$lib/agents/error_collector';
import { createAgentBranch } from '$lib/github/githubClient';

interface AgentRunMeta {
  branch_name: string;
  manifest_id: string;
  trigger_reason: string;
}

interface Agent {
  name: string;
  handler_function: string;
  can_handle: string[];
}

interface ServiceManifest {
  manifest: any;
  service_id: string;
}

export async function POST({ request }) {
  const { run_id } = await request.json();
  console.log('♻️ Agent loop triggered for run_id:', run_id);

  // 🔍 Fetch metadata from agent_run_log
  const { data: runMeta, error: metaError } = await supabaseAdmin
    .schema('ai_osp_runtime')
    .from('agent_run_log')
    .select('branch_name, manifest_id, trigger_reason')
    .eq('run_id', run_id)
    .single();

  if (metaError || !runMeta) {
    console.error('❌ Failed to fetch run metadata:', metaError);
    return json({ success: false, error: 'Missing agent_run_log metadata' }, { status: 500 });
  }

  const { branch_name, manifest_id } = runMeta as AgentRunMeta;
  console.log('📌 Branch:', branch_name, '| Manifest ID:', manifest_id);

  const simulatedTaskType = 'debugging';

  // 🔍 Step 1: Find a registered agent that handles this task
  const { data: agents, error } = await supabaseAdmin
    .schema('ai_osp_runtime')
    .from('agent_registry')
    .select('*')
    .contains('can_handle', [simulatedTaskType]);

  if (error || !agents || agents.length === 0) {
    console.error('❌ No agents found for task type:', simulatedTaskType, error);
    return json({
      success: false,
      error: 'No matching agents found.',
      details: error?.message || 'Empty agent list'
    }, { status: 500 });
  }

  const selectedAgent = agents[0] as Agent;
  console.log(`🤖 Selected agent: ${selectedAgent.name} (${selectedAgent.handler_function})`);

  try {
    const context = await collectErrorContext(run_id);

    const serviceName = manifest_id?.split('-')[0] || 'osp';
    const branchName = `agent-${serviceName}-${run_id}`;

    try {
      await createAgentBranch(branchName);
      console.log('✅ Agent GitHub branch created:', branchName);
    } catch (err: any) {
      console.error('❌ Failed to create GitHub branch:', err);
      return json({ 
        success: false, 
        error: 'GitHub branch creation failed',
        details: err?.message || 'Unknown error creating branch'
      }, { status: 500 });
    }

    const { data: manifestRow, error: manifestError } = await supabaseAdmin
      .schema('osp_metadata')
      .from('service_manifests')
      .select('*')
      .eq('id', manifest_id)
      .single();

    if (manifestError || !manifestRow) {
      console.error('❌ Failed to fetch manifest for manifest_id:', manifest_id, manifestError);
      return json({ success: false, error: 'Manifest not found' }, { status: 500 });
    }

    const manifestData = manifestRow as ServiceManifest;
    const manifest = manifestData.manifest;
    const service_id = manifestData.service_id;

    try {
      const debugModule = await import('$lib/agents/debug_suggestion_agent');
      const debug_suggestion_agent = debugModule.default;
      await debug_suggestion_agent({
        run_id,
        branch_name: branchName,
        service_id,
        input: context,
        manifest
      });
      console.log('🔍 Debug suggestion agent completed');
    } catch (err) {
      console.error('❌ Debug suggestion agent failed:', err);
    }

    const handlerResult = await debug_suggestion_agent({
      run_id,
      branch_name: branchName,
      service_id,
      input: context,
      manifest
    });
    
    console.log('🛠️ Agent handler completed:', handlerResult);

    const { error: insertError } = await supabaseAdmin
      .schema('ai_osp_runtime')
      .from('agent_event_log')
      .insert([
        {
          run_id,
          rule_id: null,
          detected_at: new Date().toISOString(),
          event_description: JSON.stringify(handlerResult),
          status: 'pending',
          violated_policies: handlerResult.violated_policies || [],
          violated_hardcore_rules: handlerResult.violated_hardcore_rules || []
        }
      ]);

    if (insertError) {
      console.error('❌ Failed to log agent result to agent_event_log:', insertError);
    } else {
      console.log('📝 Agent result logged to agent_event_log');
    }

    return json({
      success: true,
      run_id,
      selected_agent: selectedAgent,
      result: handlerResult,
      branch_name: branchName
    });
  } catch (e: any) {
    console.error('❌ Failed to load or run agent handler:', e);
    return json({
      success: false,
      error: 'Agent handler execution failed.',
      details: e.message
    }, { status: 500 });
  }
}
