// src/routes/api/services/smb_inventory/[entity]/+server.ts
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import type { Session } from '@supabase/supabase-js'; // Import Session type if needed for clarity

// Define the entities FOR WHICH RPC GET FUNCTIONS EXIST
// Adjust this list based on the actual `get_smb_inventory_...` functions you created
const validGetEntities = ['store', 'supplier', 'inventoryitem', 'part', 'bikepart', 'inventory']; // Entities handled by RPC GET

// Function to validate the entity parameter for GET requests
function validateGetEntity(entity: string | undefined) {
    // Use validGetEntities list which maps to RPC functions
    if (!entity || !validGetEntities.includes(entity.toLowerCase())) {
        throw error(400, `Unsupported entity type for GET via RPC: ${entity}`);
    }
}

// --- Helper to get validated session ---
function getValidSession(locals: App.Locals): Session { // Return Session type directly
    const sessionResult = locals.session;
    if (sessionResult?.error) {
        console.error("API Route: Session retrieval error from hook:", sessionResult.error);
        throw error(500, `Session error: ${sessionResult.error.message}`);
    }
    const session = sessionResult?.data?.session;
    if (!session) {
        console.warn("API Route: No valid session found via hook/cookies.");
        throw error(401, 'Unauthorized - No active session detected via cookies.');
    }
    return session; // Return the actual Session object
}


// Handler for GET requests (fetch data) - USING RPC
export const GET: RequestHandler = async ({ params, locals }) => {
    const entity = params.entity?.toLowerCase();
    validateGetEntity(entity); // Validate against entities with RPC functions

    const supabase = locals.supabase;
    const session = getValidSession(locals);

    console.log(`GET /api/services/smb_inventory/${entity}: Authenticated as ${session.user.email}`);

    let rpcName: string;
    let rpcParams: any = {}; // Parameters for RPC call, if any

    // Map entity name to the specific RPC function name you created
    switch(entity) {
        case 'store':
            rpcName = 'get_smb_inventory_stores';
            break;
        case 'supplier':
            rpcName = 'get_smb_inventory_suppliers';
            break;
        // Assuming 'inventoryitem' is the primary target based on frontend logic
        // And the function 'get_smb_inventory_items' handles various item table names if needed,
        // or you have separate functions like 'get_smb_inventory_parts', 'get_smb_inventory_bikeparts'
        case 'inventoryitem':
        case 'part':
        case 'bikepart':
        case 'inventory':
             rpcName = 'get_smb_inventory_items';
             // If your get_smb_inventory_items function *requires* the table name parameter:
             // rpcParams = { p_table_name: entity };
            break;
        // Add cases for other entities if you created specific getter functions for them
        default:
            // This case should ideally not be reached if validateGetEntity is correct
            throw error(500, `Internal mapping error for entity: ${entity}`);
    }

    console.log(`Calling RPC: ${rpcName}`);

    // Call the appropriate PostgreSQL function using RPC
    const { data, error: rpcError } = await supabase.rpc(rpcName, rpcParams);

    if (rpcError) {
        console.error(`Error calling RPC ${rpcName}:`, rpcError);
        throw error(500, `Failed to fetch ${entity} via RPC: ${rpcError.message}`);
    }

    // Process the data based on which function was called
    // The get_smb_inventory_items function returns [{item: jsonb}, ... ]
    // The others return SETOF table rows directly [{col1: val1,...}, ...]
    let responseData = [];
    if (rpcName === 'get_smb_inventory_items') {
         // Extract the jsonb object from each row { item: {...} }
         responseData = data ? data.map((row: any) => row.item || {}) : []; // Handle potential null items
    } else {
        responseData = data || []; // For functions returning SETOF table directly
    }

    console.log(`Successfully fetched ${entity} data via RPC. Count: ${responseData.length}`);
    return json({ data: responseData });
};

// --- POST/PUT/DELETE Handlers ---
// These still need to be implemented, likely using specific RPC functions
// (e.g., 'add_item', 'update_store', 'delete_supplier') or potentially
// using supabaseAdmin after the session check if appropriate.
// Commenting them out to ensure GET works first.

/*
export const POST: RequestHandler = async ({ params, request, locals }) => {
    const entity = params.entity?.toLowerCase();
    // validateEntity for POST if needed
    const session = getValidSession(locals);
    const body = await request.json();
    console.log(`POST /api/.../${entity}: Authenticated as ${session.user.email}`);
    // TODO: Implement using RPC('add_entity_function', { data_payload: body })
    throw error(501, 'POST not implemented yet.');
};

export const PUT: RequestHandler = async ({ params, request, locals }) => {
    const entity = params.entity?.toLowerCase();
    // validateEntity for PUT if needed
    const session = getValidSession(locals);
    const body = await request.json();
    const recordId = body.id;
     if (!recordId) { throw error(400, 'ID is required for update'); }
    console.log(`PUT /api/.../${entity}: Authenticated as ${session.user.email}`);
     // TODO: Implement using RPC('update_entity_function', { record_id: recordId, update_data: body })
    throw error(501, 'PUT not implemented yet.');
};

export const DELETE: RequestHandler = async ({ params, request, locals }) => {
    const entity = params.entity?.toLowerCase();
     // validateEntity for DELETE if needed
    const session = getValidSession(locals);
     const { id } = await request.json();
     const recordId = id;
      if (!recordId) { throw error(400, 'ID is required for deletion'); }
    console.log(`DELETE /api/.../${entity}: Authenticated as ${session.user.email}`);
    // TODO: Implement using RPC('delete_entity_function', { record_id: recordId })
    throw error(501, 'DELETE not implemented yet.');
};
*/