// src/routes/api/agent/loop/+server.ts
import { json } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabaseAdmin';
import { collectErrorContext } from '$lib/agents/error_collector';

export async function POST({ request }) {
  const { run_id } = await request.json();
  console.log('♻️ Agent loop triggered for run_id:', run_id);

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

  const selectedAgent = agents[0];
  console.log(`🤖 Selected agent: ${selectedAgent.name} (${selectedAgent.handler_function})`);

  try {
    // 📥 Step 2: Collect full context for this run
    const context = await collectErrorContext(run_id);

    // 🧠 Step 3: Dynamically import the agent and run it with full input
    const handlerModule = await import(`$lib/agents/${selectedAgent.handler_function}.ts`);
    const handler = handlerModule.default || handlerModule[selectedAgent.handler_function];

    const handlerResult = await handler(context);

    console.log('🛠️ Agent handler completed:', handlerResult);

    // 🗂️ Step 4: Log result to agent_event_log
    const { error: insertError } = await supabaseAdmin
      .schema('ai_osp_runtime')
      .from('agent_event_log')
      .insert([
        {
          run_id,
          rule_id: null, // Optional if not tied to a Hard Core rule
          detected_at: new Date().toISOString(),
          event_description: JSON.stringify(handlerResult),
          status: 'pending'
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
