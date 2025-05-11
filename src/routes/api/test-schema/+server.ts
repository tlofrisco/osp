// 📁 src/routes/api/test-schema/+server.ts
import { json } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabaseAdmin';

export async function GET() {
  const { data, error } = await supabaseAdmin.rpc('create_service_schema', {
    service_schema_name: 'an_estate_cleaning_service'
  });

  console.log('Schema created?', data);

  if (error) {
    console.error('RPC failed:', error);
    return json({ success: false, error }, { status: 500 });
  }

  return json({ success: true, result: data }, { status: 200 });
}
