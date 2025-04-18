// src/routes/api/agent/start/+server.ts
import { json } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabaseAdmin';

export async function POST({ request, fetch }) {
  console.log('🚀 Triggered /api/agent/start');

  const body = await request.json().catch(() => ({}));
  const trigger = body?.trigger || 'manual';

  // ✅ Step 1: Call the *public* insert_agent_run wrapper, which returns a scalar UUID
  const { data: run_id, error: insertError } = await supabaseAdmin.rpc('insert_agent_run', {
    trigger_reason: trigger
  });

  console.log('🧾 RPC Result:', run_id);

  if (insertError || !run_id) {
    console.error('❌ Insert Error:', insertError);
    return json({
      error: 'DB Error: Failed to create run record.',
      details: insertError?.message || 'Unknown insert error'
    }, { status: 500 });
  }

  // 🔁 Step 2: Trigger the agent loop with the new run_id
  let loopStatus = 'pending';
  let loopDetails = 'Not called';
  let loopResult = null;

  try {
    const loopResponse = await fetch('/api/agent/loop', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ run_id })
    });

    loopResult = await loopResponse.json();
    loopStatus = loopResponse.ok ? 'triggered' : 'failed';
    loopDetails = loopResult?.error || 'Loop executed';
  } catch (err) {
    loopStatus = 'fetch_error';
    loopDetails = err.message;
    console.error('❌ Failed to trigger /api/agent/loop:', err);
  }

  return json({
    success: true,
    run_id,
    loop_status: loopStatus,
    loop_details: loopDetails,
    loop_result: loopResult
  });
}
