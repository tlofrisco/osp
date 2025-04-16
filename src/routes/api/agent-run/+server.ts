import { json } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabaseAdmin';

export async function POST({ request }) {
  try {
    const { status, result_summary, trigger_event_id } = await request.json();

    const { data, error } = await supabaseAdmin
      .from('ai_osp_runtime.agent_run_log')
      .insert([
        {
          status,
          result_summary,
          trigger_event_id
        }
      ])
      .select('run_id');

    if (error) {
      console.error('🔥 Run Log Insert Error:', error);
      return json({ error: error.message }, { status: 500 });
    }

    return json({ success: true, run_id: data?.[0]?.run_id });
  } catch (err) {
    console.error('💥 Unexpected Run Log Error:', err);
    return json({ error: 'Unexpected error', message: err.message }, { status: 500 });
  }
}
