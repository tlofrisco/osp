import { json, error } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabaseAdmin';

export async function GET({ request }) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw error(401, 'Unauthorized: Missing or invalid Authorization header');
  }

  const token = authHeader.replace('Bearer ', '');
  console.log('Validating token:', token.substring(0, 10) + '...');

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) {
    throw error(401, 'Unauthorized: Invalid token');
  }

  console.log('User validated:', user.email);

  // Fetch the latest service version for smb_inventory
  const { data: serviceData, error: serviceError } = await supabaseAdmin
    .from('services')
    .select('blended_model')
    .eq('service_schema', 'smb_inventory') // Fixed: Changed 'schema' to 'service_schema'
    .order('version', { ascending: false })
    .limit(1)
    .single();

  if (serviceError || !serviceData) {
    throw error(500, 'Failed to fetch service model: ' + (serviceError?.message || 'No service found'));
  }

  return json({ blended_model: serviceData.blended_model });
}