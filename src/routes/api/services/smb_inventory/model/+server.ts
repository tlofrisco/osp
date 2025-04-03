// src/routes/api/services/smb_inventory/model/+server.ts
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ locals }) => {
  const sessionResult = locals.session;
  const supabase = locals.supabase;

  if (sessionResult?.error) {
      console.error("GET /model: Session error from hook:", sessionResult.error);
      throw error(500, `Session error: ${sessionResult.error.message}`);
  }
  const session = sessionResult?.data?.session;
  if (!session) {
    console.warn("GET /model: No valid session found.");
    throw error(401, 'Unauthorized - No active session.');
  }

  console.log(`GET /api/.../model: Authenticated as ${session.user.email}`);

  // Call the PostgreSQL function using RPC
  const { data: modelData, error: rpcError } = await supabase
    .rpc('get_smb_inventory_model'); // Call the function

  if (rpcError) {
    console.error("Error calling get_smb_inventory_model RPC:", rpcError);
    throw error(500, `Failed to fetch service model via RPC: ${rpcError.message}`);
  }

  // The function returns the JSON directly
  if (!modelData) {
      console.error("RPC get_smb_inventory_model returned null or undefined.");
       // Maybe the function found no matching service? Return 404.
      throw error(404, 'Service model not found for smb_inventory.');
  }

  console.log("Successfully fetched blended_model via RPC.");
  return json({ blended_model: modelData }); // Return the model data fetched by the function
};