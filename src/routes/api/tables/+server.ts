import { json } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabaseAdmin';

export async function GET() {
  try {
    // Debug RPC
    const { data: testData, error: testError } = await supabaseAdmin.rpc('table_exists', { p_table_name: 'services' });
    if (testError) {
      throw new Error(`Supabase RPC error: ${testError.message}`);
    }
    console.log('Test RPC response for "services":', testData);

    // List of tables to check
    const knownTables = [
      'arts_inventory', 'arts_inventoryitem', 'canonical_models', 'service_relationships',
      'service_type_mappings', 'services', 'sid_category', 'sid_consumer', 'sid_customer',
      'sid_inventory', 'sid_inventory_item', 'sid_product', 'sid_service',
      'sid_smbinventoryservice', 'sid_supplier', 'test_table'
    ];

    const tables = [];
    for (const table of knownTables) {
      const { data: exists, error } = await supabaseAdmin.rpc('table_exists', { p_table_name: table });
      if (error) {
        console.error(`Error checking ${table}:`, error.message);
        continue;
      }
      console.log(`Does ${table} exist?`, exists);
      if (exists === true) {
        tables.push({ table_name: table });
      }
    }

    if (tables.length === 0) {
      console.warn('No tables found—check RPC or table list.');
    }

    return json({ tables });
  } catch (err) {
    console.error('Error fetching tables:', err);
    return json({ error: err.message }, { status: 500 });
  }
}