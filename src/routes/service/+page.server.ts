// 📁 File: src/routes/service/+page.server.ts
import { supabaseAdmin } from '$lib/supabaseAdmin';

export async function load({ params }) {
  const { data, error } = await supabaseAdmin
    .from('services')
    .select('id, provider, prompt, spec')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error('Error loading latest service:', error);
    return { serviceName: 'N/A', spec: '', error: error.message };
  }

  return {
    serviceName: data.prompt || 'Untitled',
    spec: data.spec || ''
  };
}
