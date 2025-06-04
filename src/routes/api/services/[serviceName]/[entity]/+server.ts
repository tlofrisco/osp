// 📁 File: src/routes/service/[serviceName]/[entity]/+server.ts
import { json } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabaseAdmin';
import type { RequestHandler } from './$types';

// 🔧 Coerce values to correct SQL types
function coerceDataToTableTypes(data: Record<string, any>, columns: { column_name: string, data_type: string }[]) {
  const validatedPayload: Record<string, any> = { ...data };

  for (const column of columns) {
    const name = column.column_name;
    const type = column.data_type;

    if (type === 'numeric' || type === 'integer') {
      if (validatedPayload[name] !== undefined && typeof validatedPayload[name] === 'string') {
        const num = parseFloat(validatedPayload[name]);
        if (!isNaN(num)) {
          validatedPayload[name] = num;
        }
      }
    }
    // Extend with more coercions as needed
    console.log(`🔄 Coercing ${name}: ${data[name]} → ${validatedPayload[name]}`);
  }

  return validatedPayload;
}

export const GET: RequestHandler = async ({ params, url }) => {
  const { serviceName, entity } = params;
  const limit = parseInt(url.searchParams.get('limit') || '50');
  const offset = parseInt(url.searchParams.get('offset') || '0');

  console.log(`📖 GET request for service: ${serviceName}, entity: ${entity}, limit: ${limit}, offset: ${offset}`);

  try {
    // Build a safe SQL query for the dynamic table
    const tableName = `${serviceName}.${entity}`;
    const sqlQuery = `SELECT * FROM ${tableName} LIMIT ${limit} OFFSET ${offset}`;
    
    console.log(`🔍 Executing SQL: ${sqlQuery}`);
    
    // Use execute_sql RPC to safely query the dynamic table
    const { data, error } = await supabaseAdmin.rpc('execute_sql', {
      sql_text: sqlQuery
    });

    if (error) {
      console.error('❌ SQL execution failed:', error);
      return json({ 
        success: false, 
        error: error.message,
        data: [] 
      }, { status: 500 });
    }

    console.log(`✅ Retrieved ${data?.length || 0} records for ${serviceName}.${entity}`);

    return json({
      success: true,
      data: data || [],
      total: data?.length || 0,
      limit,
      offset
    });

  } catch (err: any) {
    console.error('❌ Unexpected error in GET handler:', err);
    return json({
      success: false,
      error: err?.message || 'Unknown error',
      data: []
    }, { status: 500 });
  }
};

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

  console.log('📊 Available columns from Supabase:', columns.map(c => c.column_name));

  // 🔧 Step 2: Trust exact field names and coerce types
  const validatedPayload = coerceDataToTableTypes(rawData, columns);

  if (!validatedPayload.id) {
    validatedPayload.id = `${entity}_${Date.now()}`;
  }

  const missingFields = columns
    .map(c => c.column_name)
    .filter(name => name !== 'id' && validatedPayload[name] == null);
  if (missingFields.length) {
    console.warn('⚠️ Missing expected fields:', missingFields);
  }

  // ✅ Confirm you're running updated handler
  console.log('🧪 Using corrected RPC param names');
  console.log('🔍 Final data sent to RPC:', validatedPayload);

  // 🚀 Step 3: Insert using corrected param names
  const { error: rpcError } = await supabaseAdmin.rpc('insert_into_dynamic_table', {
    in_schema_name: serviceName,
    in_table_name: entity,
    json_data: validatedPayload
  });

  if (rpcError) {
    console.error('❌ RPC insert failed:', rpcError);
    return json({ 
      success: false, 
      error: rpcError.message || 'Insert failed via RPC', 
      details: rpcError 
    }, { status: 500 });
  }

  return json({ 
    success: true, 
    message: 'Record created successfully',
    data: validatedPayload 
  }, { status: 200 });
};
