// 📁 File: src/routes/service/[serviceName]/+page.server.ts

import { error } from '@sveltejs/kit';
// Using supabaseAdmin (service role) - likely bypasses RLS
import { supabaseAdmin } from '$lib/supabaseAdmin';

/** @type {import('./$types').PageServerLoad} */
export async function load({ params }) {
    const { serviceName } = params;
    console.log(`[+page.server.ts load] Loading service data for: ${serviceName}`);

    // Fetch the LATEST service manifest/metadata by finding the highest 'id'
    console.log(`[+page.server.ts load] Querying 'services' table for service_schema = ${serviceName}, ordered by id DESC, limit 1`);
    const { data: serviceRecord, error: serviceError } = await supabaseAdmin
        .from('services')
        .select('spec, blended_model, service_schema, id') // Added 'id' for logging confirmation
        .eq('service_schema', serviceName) // Filter by service name
        .order('id', { ascending: false }) // Order by ID descending (latest first)
        .limit(1) // Take only the top one
        .maybeSingle(); // Fetch the single row found (or null if none)

    // Log the raw result from Supabase
    console.log('[+page.server.ts load] Supabase query result for latest service metadata:', { serviceRecord, serviceError });

    // Explicitly check for database errors first
    // maybeSingle() returns null for no rows, not an error code like PGRST116
    if (serviceError) {
        console.error('[+page.server.ts load] Supabase error fetching latest service metadata:', serviceError);
        throw error(500, `Database error fetching service: ${serviceError.message}`);
    }

    // Now check if the record was found (serviceRecord will be null if no matching service_schema was found at all)
    if (!serviceRecord) {
        console.log(`[+page.server.ts load] Service '${serviceName}' not found in 'services' table (query returned null/no rows). Throwing 404.`);
        throw error(404, `Service not found: ${serviceName}`);
    }

    // If we reached here, the latest service metadata was found successfully!
    console.log(`[+page.server.ts load] Latest service metadata for '${serviceName}' (ID: ${serviceRecord.id}) found successfully.`); // Log the ID found

    // Optional: Try to pull tables for that schema (enrichment)
    console.log(`[+page.server.ts load] Fetching table list for schema: ${serviceName}`);
    const { data: tables, error: tableError } = await supabaseAdmin
        .rpc('get_schema_tables', { schema_name: serviceName });

    if (tableError) {
        console.warn(`[+page.server.ts load] Error fetching table list for schema '${serviceName}':`, tableError);
    } else {
        console.log(`[+page.server.ts load] Tables found for schema '${serviceName}':`, tables);
    }

    // In src/routes/service/[serviceName]/+page.server.ts near the end

    console.log(`[+page.server.ts load] Returning data nested under 'service' key for service '${serviceName}' (ID: ${serviceRecord.id}) to the page.`);
    return {
      // Nest the fetched record under the 'service' key
      service: serviceRecord,
      // Keep other props if needed, or nest them too if expected
      serviceName: serviceName, // Maybe redundant if serviceRecord has it
      tables: tables || []
    };
}