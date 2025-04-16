// src/routes/test/agent-loop/+server.ts
import { json } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabaseAdmin';

export async function POST() {
  console.log('🚀 Triggering Agent Run Test via RPC');

  // Step 1: Insert a run row via raw SQL (RPC)
  const insertSQL = `
    INSERT INTO ai_osp_runtime.agent_run_log (status)
    VALUES ('test-via-sql')
    RETURNING run_id;
  `;

  const { data: insertData, error: insertError } = await supabaseAdmin.rpc('execute_sql', {
    sql_text: insertSQL,
  });

  if (insertError || !insertData || !Array.isArray(insertData) || insertData.length === 0) {
    console.error('❌ Failed to insert run_id via SQL RPC:', insertError);
    return json({ success: false, error: insertError || 'Unknown insert failure' }, { status: 500 });
  }

  const run_id = insertData[0].run_id;
  console.log('✅ Inserted run_id:', run_id);

  // Step 2: Trigger the actual agent loop
  const loopResponse = await fetch('http://localhost:5173/api/agent/loop', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ run_id }),
  });

  let loopResult;
  try {
    loopResult = await loopResponse.json();
  } catch (e) {
    console.error('❌ Failed to parse loop response JSON:', e);
    return json({ success: false, run_id, loopStatus: loopResponse.status }, { status: 500 });
  }

  console.log('🎯 Agent Loop Triggered:', loopResult);

  return json({ success: true, run_id, loopResult });
}
