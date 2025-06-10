// lib/manifest/getLatestManifestId.ts
import { supabaseAdmin } from '$lib/supabaseAdmin';

/**
 * 🔍 Fetches the latest manifest UUID (id) for a given service_id string.
 * 
 * ⚠️ LEGACY FUNCTION: Use getLatestManifestForService() instead for full manifest data.
 * 
 * @param service_id The stable service identifier (e.g. 'smb_inventory')
 * @returns UUID of the most recent manifest or null if not found
 */
export async function getLatestManifestId(service_id: string): Promise<string | null> {
  console.warn('⚠️ getLatestManifestId() is legacy. Consider using getLatestManifestForService() from manifestResolver.ts');
  
  const { data, error } = await supabaseAdmin
    .schema('osp_metadata')
    .from('service_manifests')
    .select('id')
    .eq('service_id', service_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle(); // prevents crash when no rows found

  if (!data || error) {
    console.error('❌ No manifest found for service_id:', service_id, error);
    return null; // Changed from throw to return null for graceful handling
  }
    
  console.log('📄 Latest manifest ID found for service', service_id, '→', data.id);
  return data.id;
}
