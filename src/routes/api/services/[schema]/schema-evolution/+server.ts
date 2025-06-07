import { json, error } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabaseAdmin';
import type { RequestEvent } from '@sveltejs/kit';

export async function GET({ params, locals }: RequestEvent) {
  const { schema } = params;
  const supabase = locals.supabase;
  const sessionResult = locals.session;

  if (!sessionResult) {
    throw error(401, 'Unauthorized');
  }

  const user = sessionResult.data?.user;
  if (!user?.id) {
    throw error(401, 'Unauthorized');
  }

  try {
    // First get the service ID from the schema name
    const { data: service, error: serviceError } = await supabaseAdmin
      .from('services')
      .select('id')
      .eq('service_schema', schema)
      .eq('user_id', user.id)
      .single();

    if (serviceError || !service) {
      throw error(404, 'Service not found');
    }

    // Fetch schema evolution history
    const { data: evolution, error: evolutionError } = await supabaseAdmin
      .from('schema_evolution')
      .select('*')
      .eq('service_id', service.id)
      .order('version', { ascending: false });

    if (evolutionError) {
      console.error('Failed to fetch schema evolution:', evolutionError);
      throw error(500, 'Failed to fetch schema evolution');
    }

    return json({
      evolution: evolution || []
    });

  } catch (err) {
    console.error('Schema evolution fetch error:', err);
    if (err instanceof Error && 'status' in err) {
      throw err;
    }
    throw error(500, 'Internal server error');
  }
} 