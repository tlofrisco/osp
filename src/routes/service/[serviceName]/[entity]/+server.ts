// 📁 File: src/routes/api/services/[service_schema]/[entity]/+server.ts
import { json } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabaseAdmin';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, params }) => {
  const { service_schema, entity } = params;
  const formData = await request.json();

  console.log(`POST received for schema '${service_schema}', table '${entity}'`);
  console.log('Form Data:', formData);

  const { data, error } = await supabaseAdmin
    .from(`${service_schema}.${entity}`)
    .insert([formData]);

  if (error) {
    console.error('❌ Supabase insert error:', error);
    return json({ message: error.message }, { status: 500 });
  }

  return json({ message: 'Insert successful', data }, { status: 200 });
};
