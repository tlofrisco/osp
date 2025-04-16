// routes/api/test-insert/+server.ts
import { supabaseAdmin } from '$lib/supabase'
import { json } from '@sveltejs/kit'

export async function POST() {
  const { data, error } = await supabaseAdmin
    .from('ai_osp_runtime.agent_run_log')
    .insert({ status: 'testing-insert' }) // minimal allowed field

  return json({ data, error })
}