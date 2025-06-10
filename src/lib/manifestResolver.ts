// src/lib/manifestResolver.ts
import { supabaseAdmin } from '$lib/supabaseAdmin';
import { type ManifestStatus } from './osp/manifestAudit';

/**
 * 🔍 Get Latest Manifest for Service (UUID-based)
 * 
 * Fetches the latest manifest for a given service_id using UUID-based lookups.
 * This replaces legacy service name/schema based lookups.
 * 
 * Part of OSP Refactor Sets 04+05+07: Governance, Locking, and Auditability
 */
export async function getLatestManifestForService(serviceId: string, statusFilter: ManifestStatus[] = ['active']) {
  const { data, error } = await supabaseAdmin
    .schema('osp_metadata')
    .from('service_manifests')
    .select('*')
    .eq('service_id', serviceId)
    .in('status', statusFilter)  // 🔐 Only fetch manifests with allowed status
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error('❌ Failed to fetch latest manifest:', error);
    return null;
  }

  // 🔐 Additional governance check
  if (data && data.status === 'locked') {
    console.warn('⚠️ Retrieved locked manifest - read-only access only');
  }

  console.log('📄 Latest manifest loaded for service', serviceId, '→', data?.id, `(status: ${data?.status})`);
  return data;
}

/**
 * 🔍 Get Manifest by UUID
 * 
 * Direct lookup of manifest by its UUID (preferred method).
 * Includes governance status checking.
 */
export async function getManifestById(manifestId: string, allowedStatuses: ManifestStatus[] = ['active', 'locked', 'deprecated']) {
  const { data, error } = await supabaseAdmin
    .schema('osp_metadata')
    .from('service_manifests')
    .select('*')
    .eq('id', manifestId)
    .single();

  if (error) {
    console.error('❌ Failed to fetch manifest by ID:', error);
    return null;
  }

  // 🔐 Status validation
  if (data && !allowedStatuses.includes(data.status as ManifestStatus)) {
    console.warn(`⚠️ Manifest ${manifestId} has status '${data.status}' which is not in allowed list:`, allowedStatuses);
    return null;
  }

  // 🔐 Additional governance logging
  if (data && data.status === 'locked') {
    console.warn('⚠️ Retrieved locked manifest - read-only access only');
  }

  console.log('📄 Manifest loaded by UUID', manifestId, `(status: ${data?.status}, version: ${data?.version})`);
  return data;
}

export async function resolveManifest({
  baseManifest,
  inheritsFrom = [],
  overrides = {}
}: {
  baseManifest: any;
  inheritsFrom: Array<{ type: string; ref: string }>;
  overrides: Record<string, any>;
}): Promise<any> {
  let resolved: any = structuredClone(baseManifest) || {};

  for (const { type, ref } of inheritsFrom) {
    const { data, error } = await supabaseAdmin
      .from(getTableForType(type))
      .select('payload')
      .eq('id', ref)
      .maybeSingle();

    if (error) throw new Error(`Failed to fetch ${type} with ref ${ref}: ${error.message}`);

    if (data && data.payload) {
      resolved = deepMerge(resolved, data.payload);
    }
  }

  // Finally apply overrides
  resolved = deepMerge(resolved, overrides);
  return resolved;
}

function getTableForType(type: string): string {
  switch (type) {
    case 'hardcore_rules':
      return 'osp_metadata.hardcore_rules';
    case 'ui_style':
      return 'osp_metadata.ui_style_guides';
    case 'plugin':
      return 'osp_metadata.plugins';
    case 'workflow':
      return 'osp_metadata.workflows';
    case 'billing_policy':
      return 'osp_metadata.billing_policies';
    default:
      throw new Error(`Unknown inheritance type: ${type}`);
  }
}

// Deep merge function for manifest layers
function deepMerge(target: any, source: any): any {
  for (const key of Object.keys(source)) {
    if (
      typeof source[key] === 'object' &&
      source[key] !== null &&
      !(source[key] instanceof Array)
    ) {
      if (!target[key]) target[key] = {};
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}
