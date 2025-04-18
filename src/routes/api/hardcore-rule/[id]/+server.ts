// src/routes/api/hardcore-rule/[id]/+server.ts
import { json } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabaseAdmin';

export async function GET({ params }) {
  const { id } = params;

  const { data, error } = await supabaseAdmin
    .schema('osp_metadata')
    .from('hardcore_rules')
    .select('content_md')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('❌ Failed to fetch hardcore rule:', error);
    return json({ error: 'Could not fetch rule' }, { status: 500 });
  }

  return json(data);
}
