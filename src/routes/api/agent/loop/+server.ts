// src/routes/api/agent/loop/+server.ts
import { json } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabaseAdmin';

export async function POST({ request }) {
  const { run_id } = await request.json();
  console.log('♻️ Agent loop triggered for run_id:', run_id);

  const simulatedTaskType = 'debugging';

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

  const selectedAgent = agents[0];
  console.log(`🤖 Selected agent: ${selectedAgent.name} (${selectedAgent.handler_function})`);

  // 👇 Dynamic handler execution
  try {
    const handlerModule = await import(`$lib/agents/${selectedAgent.handler_function}.ts`);
    const handlerResult = await handlerModule.default({ run_id });

    console.log('🛠️ Agent handler completed:', handlerResult);

    return json({
      success: true,
      run_id,
      selected_agent: selectedAgent,
      result: handlerResult
    });
  } catch (e) {
    console.error('❌ Failed to load or run agent handler:', e);
    return json({
      success: false,
      error: 'Agent handler execution failed.',
      details: e.message
    }, { status: 500 });
  }
}

