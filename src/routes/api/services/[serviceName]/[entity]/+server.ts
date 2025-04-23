// 📁 src/routes/api/services/[serviceName]/[entity]/+server.ts
import { json } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabaseAdmin';

function normalizeKey(key: string) {
  return key
    .replace(/([a-z])([A-Z])/g, '$1_$2') // camelCase to snake_case
    .toLowerCase()
    .replace(/[^\w]/g, ''); // remove special chars
}

export async function POST({ params, request }) {
  const { serviceName, entity } = params;
  const rawFormData = await request.json();

  console.log('📩 Received POST request');
  console.log('🔧 Target schema & table:', `${serviceName}.${entity}`);
  console.log('📝 Raw form data:', rawFormData);

  const formData: Record<string, any> = {};
  for (const [key, value] of Object.entries(rawFormData)) {
    const cleanKey = normalizeKey(key);
    formData[cleanKey] = value;
  }

  if (!formData.id) {
    formData.id = `${entity}_${Date.now()}`;
    console.log('🆔 Auto-generated ID:', formData.id);
  }

  const { data, error } = await supabaseAdmin
    .from(`${serviceName}.${entity}`)
    .insert([formData]);

  if (error) {
    console.error('❌ Supabase insert error:', error);
    return json({ message: error.message || 'Insert failed', details: error.details }, { status: 500 });
  }

  console.log('✅ Insert successful:', data);
  return json({ message: 'Item inserted successfully.', data }, { status: 200 });
}
