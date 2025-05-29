// src/lib/manifestResolver.ts
import { supabaseAdmin } from '$lib/supabaseAdmin';

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
