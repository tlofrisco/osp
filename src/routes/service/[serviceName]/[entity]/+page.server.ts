import { supabaseAdmin } from '$lib/supabaseAdmin';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  const { serviceName, entity } = params;

  // Get the service manifest from the metadata table
  const { data: serviceData, error: serviceError } = await supabaseAdmin
    .from('services')
    .select('blended_model, service_schema')
    .eq('service_schema', serviceName)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (serviceError || !serviceData) {
    return {
      status: 404,
      error: new Error('Service manifest not found.')
    };
  }

  const manifest = {
    schema: serviceData.service_schema,
    entities: Object.entries(serviceData.blended_model.entities || {}).map(([name, def]) => ({
      name,
      attributes: def.attributes,
      relationships: def.relationships
    }))
  };

  return {
    serviceName,
    entityName: entity,
    manifest
  };
};
