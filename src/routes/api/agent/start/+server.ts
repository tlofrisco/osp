import { json } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabaseAdmin';
import { createAgentBranch } from '$lib/github/githubClient';
import { getLatestManifestId } from '$lib/manifest/getLatestManifestId';

export async function POST({ request }) {
  const body = await request.json();
  const trigger = body?.trigger || 'manual_start';
  const service_id = body?.service_id; // Human-readable text ID (e.g., 'smb_inventory')

  if (!service_id) {
    return json({ error: 'Missing service_id in request' }, { status: 400 });
  }

  // 🧠 Step 1: Generate branch_name
  const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
  const branch_name = `agent-debug-run-${timestamp}`;

  // 🌿 Step 2: Create GitHub branch
  const branchResult = await createAgentBranch(branch_name);
  if (!branchResult.success) {
    console.error('❌ Branch creation failed:', branchResult.error);
    return json({ error: 'Git branch creation failed', details: branchResult.error }, { status: 500 });
  }

  // 🔍 Step 3: Get latest manifest UUID for the given service_id
  const latestManifestId = await getLatestManifestId(service_id);
  if (!latestManifestId) {
    console.error('❌ No manifest found for service_id:', service_id);
    return json({ error: 'Service manifest not found' }, { status: 404 });
  }

  // ✅ Step 4: Call RPC with manifest UUID as service_id
  const { data: run_id, error: insertError } = await supabaseAdmin.rpc('insert_agent_run', {
    trigger_reason: trigger,
    branch_name,
    service_id: latestManifestId
  });

  console.log('🧾 RPC Result:', run_id);

  if (insertError || !run_id) {
    console.error('❌ Insert Error:', insertError);
    return json({
      error: 'DB Error: Failed to create run record.',
      details: insertError?.message || 'Unknown insert error'
    }, { status: 500 });
  }

  // 🔁 Step 5: Trigger the agent loop
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
    branch_name,
    service_id: latestManifestId, // UUID used as canonical service_id
    loop_status: loopStatus,
    loop_details: loopDetails,
    loop_result: loopResult
  });
}
