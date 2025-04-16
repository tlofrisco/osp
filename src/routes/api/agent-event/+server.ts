import { json } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabaseAdmin';

export async function POST({ request }) {
  try {
    const body = await request.json();
    const { run_id, rule_id, description } = body;

    console.log('🚀 Incoming Payload:', body);

    const insertPayload = {
      run_id,
      rule_id,
      event_description: description,
      status: 'pending'
    };

    console.log('📦 Insert Object:', insertPayload);

    const response = await supabaseAdmin
      .from('ai_osp_runtime.agent_event_log')
      .insert(insertPayload);

    console.log('📥 Supabase Response:', JSON.stringify(response, null, 2));

    const { data, error } = response;

    if (error) {
      return json({ error: error.message || 'Unknown error', details: error.details }, { status: 500 });
    }

    return json({ success: true, event_id: data?.[0]?.event_id });
  } catch (err) {
    console.error('💥 Unexpected error:', err);
    return json({ error: 'Unexpected error', message: err.message }, { status: 500 });
  }
}
