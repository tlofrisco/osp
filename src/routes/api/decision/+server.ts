import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabase';

export async function POST({ request }) {
  const body = await request.json();
  const { event_id, decision, notes, decided_by } = body;

  const { error } = await supabase
    .from('agent_event_log')
    .update({
      status: decision === 'yes' ? 'approved' :
              decision === 'no' ? 'rejected' : 'conditional_approved',
      decision_outcome: decision,
      decision_notes: notes,
      decided_by,
      decided_at: new Date().toISOString()
    })
    .eq('event_id', event_id);

  if (error) return json({ error }, { status: 500 });

  return json({ success: true });
}
