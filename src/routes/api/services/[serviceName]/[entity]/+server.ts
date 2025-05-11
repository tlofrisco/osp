// 📁 File: src/routes/service/[serviceName]/[entity]/+server.ts
import { json } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabaseAdmin';
import type { RequestHandler } from './$types';

// 🔧 Coerce values to correct SQL types
function coerceDataToTableTypes(data: Record<string, any>, columns: { column_name: string, data_type: string }[]) {
  const coerced: Record<string, any> = { ...data };

  for (const column of columns) {
    const name = column.column_name;
    const type = column.data_type;

    if (type === 'numeric' || type === 'integer') {
      if (coerced[name] !== undefined && typeof coerced[name] === 'string') {
        const num = parseFloat(coerced[name]);
        if (!isNaN(num)) {
          coerced[name] = num;
        }
      }
    }
    // Extend with more coercions as needed
  }

  return coerced;
}

export const POST: RequestHandler = async ({ request, params }) => {
  const { serviceName, entity } = params;
  const rawData = await request.json();

  console.log(`📩 RPC POST request received for service: ${serviceName}, table: ${entity}`);
  console.log('📝 Incoming raw data:', rawData);

  // 🔍 Step 1: Get table column metadata via RPC
  const { data: columns, error: colErr } = await supabaseAdmin.rpc('get_table_columns', {
    schema_name: serviceName,
    table_name: entity
  });

  if (colErr || !columns) {
    console.error('❌ Could not load metadata:', colErr);
    return json({ message: 'Could not load table metadata', error: colErr }, { status: 500 });
  }

  // 🔧 Step 2: Trust exact field names and coerce types
  const coerced = coerceDataToTableTypes(rawData, columns);

  if (!coerced.id) {
    coerced.id = `${entity}_${Date.now()}`;
  }

  // ✅ Confirm you're running updated handler
  console.log('🧪 Using corrected RPC param names');
  console.log('🔍 Final data sent to RPC:', coerced);

  // 🚀 Step 3: Insert using corrected param names
  const { error: rpcError } = await supabaseAdmin.rpc('insert_into_dynamic_table', {
    in_schema_name: serviceName,
    in_table_name: entity,
    json_data: coerced
  });

  if (rpcError) {
    console.error('❌ RPC insert failed:', rpcError);
    return json({ message: 'Insert failed via RPC', details: rpcError }, { status: 500 });
  }

  return json({ message: '✅ Inserted successfully via RPC', inserted: coerced }, { status: 200 });
};
