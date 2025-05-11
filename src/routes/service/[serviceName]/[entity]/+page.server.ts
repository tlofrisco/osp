// 📁 File: src/routes/service/[serviceName]/[entity]/+page.server.ts
import { supabaseAdmin } from '$lib/supabaseAdmin';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  const { serviceName, entity } = params;

  // Fetch the service metadata
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
      error: new Error('Service metadata not found')
    };
  }

  const schema = serviceData.service_schema;
  let columns = [];

  // Try loading real column names from information_schema
  const { data: schemaCols, error: schemaError } = await supabaseAdmin
    .from('information_schema.columns')
    .select('column_name, data_type')
    .eq('table_schema', schema)
    .eq('table_name', entity);

  if (schemaCols && schemaCols.length > 0) {
    columns = schemaCols.map(col => ({
      name: col.column_name,
      type: col.data_type
    }));
  } else {
    console.warn('⚠️ Falling back to manifest for column names');
    const manifestEntity = serviceData.blended_model.entities?.[entity];
    if (manifestEntity?.attributes) {
      columns = Object.entries(manifestEntity.attributes).map(([name, type]) => ({
        name,
        type
      }));
    }
  }

  // Package manifest (for debugging or fallback rendering)
  const manifest = {
    schema,
    entities: Object.entries(serviceData.blended_model.entities || {}).map(([name, def]) => ({
      name,
      attributes: def.attributes,
      relationships: def.relationships
    }))
  };

  return {
    serviceName,
    entityName: entity,
    schema,
    columns,
    manifest
  };
};
