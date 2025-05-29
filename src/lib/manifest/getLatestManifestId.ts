// lib/manifest/getLatestManifestId.ts
import { supabaseAdmin } from '$lib/supabaseAdmin';

/**
 * Fetches the latest manifest UUID (id) for a given service_id string.
 * @param service_id The stable service identifier (e.g. 'smb_inventory')
 * @returns UUID of the most recent manifest or null if not found
 */
export async function getLatestManifestId(service_id: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('service_manifests')
    .select('id')
    .eq('service_id', service_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle(); // prevents crash when no rows found

  if (!data || error) {
    console.error('❌ No manifest found for service_id:', service_id, error);
    throw new Error(`No manifest found for service_id: ${service_id}`);
  }
    
  return data.id;
}
