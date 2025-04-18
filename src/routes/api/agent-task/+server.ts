// src/routes/api/agent-task/+server.ts
import { json } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabaseAdmin';

// POST: Log a new task using RPC
export async function POST({ request }) {
  try {
    const body = await request.json();
    const { run_id, task_type, payload } = body;

    console.log('🚀 Incoming Task Payload:', body);

    const { data: task_id, error } = await supabaseAdmin.rpc('insert_agent_task_queue', {
      _run_id: run_id,
      _task_type: task_type,
      _payload: payload
    });

    if (error) {
      console.error('❌ Insert Error:', error);
      return json({ error: error.message || 'Unknown insert error', details: error.details }, { status: 500 });
    }

    return json({ success: true, task_id });
  } catch (err) {
    console.error('💥 Unexpected error:', err);
    return json({ error: 'Unexpected error', message: err.message }, { status: 500 });
  }
}

// GET: Fetch most recent pending task for processing
export async function GET() {
  const { data, error } = await supabaseAdmin
    .schema('ai_osp_runtime')
    .from('agent_task_queue')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('❌ Failed to fetch pending task:', error);
    return json({ error: 'Could not fetch task' }, { status: 500 });
  }

  return json({ task: data });
}
