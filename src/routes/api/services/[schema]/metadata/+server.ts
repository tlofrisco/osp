import { json, error } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabaseAdmin';

export async function GET({ params, locals }: RequestEvent) {
  const { schema } = params;
  
  if (!schema) {
    throw error(400, 'Schema parameter is required');
  }

  try {
    // Fetch service metadata
    const { data: service, error: fetchError } = await supabaseAdmin
      .from('services')
      .select('metadata, blended_model, service_schema')
      .eq('service_schema', schema)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !service) {
      throw error(404, `Service not found: ${schema}`);
    }

    return json({
      metadata: service.metadata || {},
      blended_model: service.blended_model || {},
      service_schema: service.service_schema
    });

  } catch (err) {
    console.error('Error fetching service metadata:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    throw error(500, `Failed to fetch service metadata: ${message}`);
  }
} 