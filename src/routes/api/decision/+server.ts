import { json } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabaseAdmin';

export async function POST({ request, fetch }) {
  const body = await request.json();
  const { event_id, decision, notes, decided_by } = body;

  if (!event_id || !decision || !decided_by) {
    return json({ error: 'Missing required fields.' }, { status: 400 });
  }

  const statusMap = {
    yes: 'approved',
    no: 'rejected',
    conditional: 'conditional_approved'
  };

  const status = statusMap[decision.toLowerCase()] ?? 'unknown';
  if (status === 'unknown') {
    return json({ error: 'Invalid decision value.' }, { status: 400 });
  }

  // Step 1: Update agent_event_log
  const { error: eventError } = await supabaseAdmin
    .schema('ai_osp_runtime')
    .from('agent_event_log')
    .update({
      status,
      decision_outcome: decision,
      decision_notes: notes ?? null,
      decided_by,
      decided_at: new Date().toISOString()
    })
    .eq('event_id', event_id);

  if (eventError) {
    return json({ error: eventError }, { status: 500 });
  }

  // Step 2: Fetch run_id to complete and possibly resume
  const { data: eventRow, error: fetchError } = await supabaseAdmin
    .schema('ai_osp_runtime')
    .from('agent_event_log')
    .select('run_id')
    .eq('event_id', event_id)
    .maybeSingle();

  const run_id = eventRow?.run_id;

  if (fetchError || !run_id) {
    return json({ error: 'Failed to fetch related run.' }, { status: 500 });
  }

  // Step 3: Complete the current run
  const { error: runError } = await supabaseAdmin
    .schema('ai_osp_runtime')
    .from('agent_run_log')
    .update({
      status: 'completed',
      ended_at: new Date().toISOString()
    })
    .eq('run_id', run_id);

  if (runError) {
    console.warn('⚠️ Decision recorded, but failed to update run:', runError);
  }

  // ✅ Step 4: Auto-resume agent loop on approval
  if (decision.toLowerCase() === 'yes') {
    console.log('🔁 Auto-resuming loop...');
    await fetch('/api/agent/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trigger: 'resume_after_approval' })
    });
  }

  return json({ success: true });
}

