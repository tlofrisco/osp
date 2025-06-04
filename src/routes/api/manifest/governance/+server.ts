/**
 * 🏛️ Governance API for Hierarchical Manifest System
 * 
 * This endpoint manages:
 * - Governance layer configurations
 * - Manifest templates (Global Laws, Global Defaults, Portfolio Laws)
 * - Policy enforcement and compliance
 * - Inheritance rules and conflict resolution
 * 
 * Endpoints:
 * GET    /api/manifest/governance - List governance layers and templates
 * POST   /api/manifest/governance - Create new governance layer or template
 * PUT    /api/manifest/governance - Update governance configuration
 * DELETE /api/manifest/governance - Remove governance layer/template
 */

import { json } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabaseAdmin';
import type { RequestHandler } from './$types';
import { createManifestEngine } from '$lib/manifest/hierarchicalManifestEngine';

// 🎯 GET - List governance configurations
export const GET: RequestHandler = async ({ url }) => {
  try {
    const action = url.searchParams.get('action');
    const layer_type = url.searchParams.get('layer_type');
    const scope = url.searchParams.get('scope');
    const template_type = url.searchParams.get('template_type');

    switch (action) {
      case 'layers':
        return await getGovernanceLayers(layer_type, scope);
      
      case 'templates':
        return await getManifestTemplates(template_type);
      
      case 'inheritance':
        const manifest_id = url.searchParams.get('manifest_id');
        if (!manifest_id) {
          return json({ success: false, error: 'manifest_id required for inheritance query' }, { status: 400 });
        }
        return await getInheritanceChain(manifest_id);
      
      case 'compliance':
        const service_id = url.searchParams.get('service_id');
        if (!service_id) {
          return json({ success: false, error: 'service_id required for compliance query' }, { status: 400 });
        }
        return await getComplianceStatus(service_id);
      
      case 'resolve':
        const resolve_service_id = url.searchParams.get('service_id');
        const creator_id = url.searchParams.get('creator_id');
        if (!resolve_service_id) {
          return json({ success: false, error: 'service_id required for manifest resolution' }, { status: 400 });
        }
        return await resolveServiceManifest(resolve_service_id, creator_id);
      
      default:
        return await getGovernanceOverview();
    }

  } catch (error) {
    console.error('❌ Governance GET error:', error);
    return json({
      success: false,
      error: 'Failed to fetch governance data',
      details: error.message
    }, { status: 500 });
  }
};

// 🎯 POST - Create governance layer or template
export const POST: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json();
    const { type, ...config } = data;

    switch (type) {
      case 'governance_layer':
        return await createGovernanceLayer(config);
      
      case 'manifest_template':
        return await createManifestTemplate(config);
      
      case 'inheritance_rule':
        return await createInheritanceRule(config);
      
      default:
        return json({ success: false, error: 'Invalid type specified' }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ Governance POST error:', error);
    return json({
      success: false,
      error: 'Failed to create governance configuration',
      details: error.message
    }, { status: 500 });
  }
};

// 🎯 PUT - Update governance configuration
export const PUT: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json();
    const { type, id, ...updates } = data;

    switch (type) {
      case 'governance_layer':
        return await updateGovernanceLayer(id, updates);
      
      case 'manifest_template':
        return await updateManifestTemplate(id, updates);
      
      case 'compliance_resolution':
        return await updateComplianceResolution(id, updates);
      
      default:
        return json({ success: false, error: 'Invalid type specified' }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ Governance PUT error:', error);
    return json({
      success: false,
      error: 'Failed to update governance configuration',
      details: error.message
    }, { status: 500 });
  }
};

// 🎯 DELETE - Remove governance configuration
export const DELETE: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json();
    const { type, id, force = false } = data;

    switch (type) {
      case 'governance_layer':
        return await deleteGovernanceLayer(id, force);
      
      case 'manifest_template':
        return await deleteManifestTemplate(id, force);
      
      case 'inheritance_rule':
        return await deleteInheritanceRule(id);
      
      default:
        return json({ success: false, error: 'Invalid type specified' }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ Governance DELETE error:', error);
    return json({
      success: false,
      error: 'Failed to delete governance configuration',
      details: error.message
    }, { status: 500 });
  }
};

// 🔧 Implementation Functions

async function getGovernanceOverview() {
  const [layers, templates, recentCompliance] = await Promise.all([
    supabaseAdmin.schema('osp_metadata').from('governance_layers').select('*').limit(10),
    supabaseAdmin.schema('osp_metadata').from('manifest_templates').select('*').limit(10),
    supabaseAdmin.schema('osp_metadata').from('policy_compliance_log').select('*').order('created_at', { ascending: false }).limit(5)
  ]);

  return json({
    success: true,
    data: {
      governance_layers: layers.data || [],
      manifest_templates: templates.data || [],
      recent_compliance_checks: recentCompliance.data || [],
      summary: {
        total_layers: layers.data?.length || 0,
        total_templates: templates.data?.length || 0,
        recent_violations: recentCompliance.data?.filter(c => c.compliance_status === 'violations').length || 0
      }
    }
  });
}

async function getGovernanceLayers(layer_type?: string, scope?: string) {
  let query = supabaseAdmin.schema('osp_metadata').from('governance_layers').select('*');
  
  if (layer_type) {
    query = query.eq('layer_type', layer_type);
  }
  if (scope) {
    query = query.eq('scope_identifier', scope);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw error;

  return json({
    success: true,
    data: data || [],
    count: data?.length || 0
  });
}

async function getManifestTemplates(template_type?: string) {
  let query = supabaseAdmin.schema('osp_metadata').from('manifest_templates').select('*');
  
  if (template_type) {
    query = query.eq('template_type', template_type);
  }

  const { data, error } = await query.order('usage_count', { ascending: false });

  if (error) throw error;

  return json({
    success: true,
    data: data || [],
    count: data?.length || 0
  });
}

async function getInheritanceChain(manifest_id: string) {
  const { data: inheritance, error } = await supabaseAdmin
    .schema('osp_metadata')
    .from('manifest_inheritance')
    .select(`
      *,
      parent_manifest:service_manifests!manifest_inheritance_parent_source_id_fkey(service_name, version)
    `)
    .eq('child_manifest_id', manifest_id)
    .order('created_at', { ascending: true });

  if (error) throw error;

  return json({
    success: true,
    data: {
      manifest_id,
      inheritance_chain: inheritance || [],
      chain_depth: inheritance?.length || 0
    }
  });
}

async function getComplianceStatus(service_id: string) {
  const [manifest, complianceLog] = await Promise.all([
    supabaseAdmin.schema('osp_metadata').from('service_manifests').select('*').eq('service_id', service_id).maybeSingle(),
    supabaseAdmin.schema('osp_metadata').from('policy_compliance_log').select('*').eq('manifest_id', service_id).order('created_at', { ascending: false }).limit(10)
  ]);

  if (manifest.error) throw manifest.error;
  if (!manifest.data) {
    return json({ success: false, error: 'Service manifest not found' }, { status: 404 });
  }

  const latestCompliance = complianceLog.data?.[0];
  
  return json({
    success: true,
    data: {
      service_id,
      manifest: manifest.data,
      latest_compliance: latestCompliance,
      compliance_history: complianceLog.data || [],
      status: latestCompliance?.compliance_status || 'unknown'
    }
  });
}

async function resolveServiceManifest(service_id: string, creator_id?: string) {
  try {
    const manifestEngine = createManifestEngine();
    const resolution = await manifestEngine.resolveServiceManifest(
      service_id,
      creator_id,
      {
        includeCache: true,
        validateCompliance: true,
        generateWarnings: true
      }
    );

    return json({
      success: true,
      data: {
        service_id,
        creator_id,
        resolved_manifest: resolution.resolved,
        inheritance_chain: resolution.inheritance_chain,
        compliance: resolution.compliance,
        performance_metrics: resolution.performance_metrics
      }
    });

  } catch (error) {
    return json({
      success: false,
      error: 'Failed to resolve service manifest',
      details: error.message
    }, { status: 500 });
  }
}

async function createGovernanceLayer(config: any) {
  const { data, error } = await supabaseAdmin
    .schema('osp_metadata')
    .from('governance_layers')
    .insert([{
      layer_name: config.layer_name,
      layer_type: config.layer_type,
      scope_identifier: config.scope_identifier,
      inheritance_rules: config.inheritance_rules || {},
      override_policies: config.override_policies || {},
      enforcement_matrix: config.enforcement_matrix || {},
      approval_required: config.approval_required || false,
      approval_chain: config.approval_chain || [],
      auto_propagate: config.auto_propagate !== false,
      created_by: config.created_by || 'system'
    }])
    .select()
    .single();

  if (error) throw error;

  return json({
    success: true,
    data: data,
    message: `Governance layer "${config.layer_name}" created successfully`
  });
}

async function createManifestTemplate(config: any) {
  const { data, error } = await supabaseAdmin
    .schema('osp_metadata')
    .from('manifest_templates')
    .insert([{
      template_name: config.template_name,
      template_type: config.template_type,
      category: config.category,
      description: config.description,
      author_id: config.author_id || 'system',
      template_manifest: config.template_manifest,
      required_fields: config.required_fields || [],
      optional_fields: config.optional_fields || [],
      locked_fields: config.locked_fields || [],
      enforcement_policy: config.enforcement_policy || { default_enforcement: 'recommended' },
      compatibility_matrix: config.compatibility_matrix || {},
      validation_rules: config.validation_rules || {},
      version: config.version || '1.0.0',
      status: config.status || 'draft'
    }])
    .select()
    .single();

  if (error) throw error;

  return json({
    success: true,
    data: data,
    message: `Manifest template "${config.template_name}" created successfully`
  });
}

async function createInheritanceRule(config: any) {
  const { data, error } = await supabaseAdmin
    .schema('osp_metadata')
    .from('manifest_inheritance')
    .insert([{
      child_manifest_id: config.child_manifest_id,
      parent_source_type: config.parent_source_type,
      parent_source_id: config.parent_source_id,
      inheritance_path: config.inheritance_path || ['*'],
      enforcement_level: config.enforcement_level || 'recommended',
      override_rules: config.override_rules || {},
      conflict_resolution_strategy: config.conflict_resolution_strategy || 'parent_wins',
      inherited_version: config.inherited_version
    }])
    .select()
    .single();

  if (error) throw error;

  return json({
    success: true,
    data: data,
    message: 'Inheritance rule created successfully'
  });
}

async function updateGovernanceLayer(id: string, updates: any) {
  const { data, error } = await supabaseAdmin
    .schema('osp_metadata')
    .from('governance_layers')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  return json({
    success: true,
    data: data,
    message: 'Governance layer updated successfully'
  });
}

async function updateManifestTemplate(id: string, updates: any) {
  const { data, error } = await supabaseAdmin
    .schema('osp_metadata')
    .from('manifest_templates')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  return json({
    success: true,
    data: data,
    message: 'Manifest template updated successfully'
  });
}

async function updateComplianceResolution(id: string, updates: any) {
  const { data, error } = await supabaseAdmin
    .schema('osp_metadata')
    .from('policy_compliance_log')
    .update({
      resolution_status: updates.resolution_status,
      resolved_by: updates.resolved_by,
      resolved_at: new Date().toISOString(),
      resolution_notes: updates.resolution_notes
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  return json({
    success: true,
    data: data,
    message: 'Compliance resolution updated successfully'
  });
}

async function deleteGovernanceLayer(id: string, force: boolean) {
  // Check for dependent manifests first
  const { data: dependents } = await supabaseAdmin
    .schema('osp_metadata')
    .from('manifest_inheritance')
    .select('child_manifest_id')
    .eq('parent_source_type', 'governance_layer')
    .eq('parent_source_id', id);

  if (dependents && dependents.length > 0 && !force) {
    return json({
      success: false,
      error: 'Cannot delete governance layer with dependent manifests',
      dependent_count: dependents.length,
      message: 'Use force=true to delete anyway (this will break inheritance for dependent manifests)'
    }, { status: 409 });
  }

  const { error } = await supabaseAdmin
    .schema('osp_metadata')
    .from('governance_layers')
    .delete()
    .eq('id', id);

  if (error) throw error;

  return json({
    success: true,
    message: 'Governance layer deleted successfully',
    affected_dependents: dependents?.length || 0
  });
}

async function deleteManifestTemplate(id: string, force: boolean) {
  // Check usage first
  const { data: template } = await supabaseAdmin
    .schema('osp_metadata')
    .from('manifest_templates')
    .select('usage_count, template_name')
    .eq('id', id)
    .single();

  if (template && template.usage_count > 0 && !force) {
    return json({
      success: false,
      error: 'Cannot delete template that is currently in use',
      usage_count: template.usage_count,
      message: 'Use force=true to delete anyway'
    }, { status: 409 });
  }

  const { error } = await supabaseAdmin
    .schema('osp_metadata')
    .from('manifest_templates')
    .delete()
    .eq('id', id);

  if (error) throw error;

  return json({
    success: true,
    message: `Template "${template?.template_name}" deleted successfully`
  });
}

async function deleteInheritanceRule(id: string) {
  const { error } = await supabaseAdmin
    .schema('osp_metadata')
    .from('manifest_inheritance')
    .delete()
    .eq('id', id);

  if (error) throw error;

  return json({
    success: true,
    message: 'Inheritance rule deleted successfully'
  });
} 