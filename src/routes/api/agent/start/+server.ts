// src/routes/api/agent/start/+server.ts
import { json } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabaseAdmin';

export async function POST({ fetch }) {
  console.log('🚀 Triggered /api/agent/start');

  // Step 1: Insert via RPC
  const { data: runInsert, error: insertError } = await supabaseAdmin.rpc('insert_agent_run');

  console.log('🧾 RPC Result:', runInsert);
  if (insertError) {
    console.error('❌ Insert Error:', insertError);
    return json({
      error: 'DB Error: Failed to create run record.',
      details: insertError.message || 'Unknown insert error'
    }, { status: 500 });
  }

  const run_id = runInsert?.[0]?.run_id;
  if (!run_id) {
    console.error('❌ No run_id returned from RPC.');
    return json({
      error: 'Server Error: Failed to retrieve run_id after creation.',
      details: 'RPC function did not return run_id'
    }, { status: 500 });
  }

  // Step 2: Trigger the loop
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
