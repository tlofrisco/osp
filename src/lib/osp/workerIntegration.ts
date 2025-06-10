/**
 * 🔗 OSP Worker Integration
 * 
 * Connects OSP service creation to automated worker deployment.
 * Called automatically when services are created via OSP UI.
 * 
 * Part of OSP Refactor Sets 04+05+07: Governance, Locking, and Auditability
 */

import { queueWorkerBuild } from '../../../workers/queueWorkerBuild.js';
import { supabaseAdmin } from '$lib/supabaseAdmin';
import { 
  enforceManifestGovernance, 
  logAuditEntry, 
  type ManifestStatus,
  type AuditLogEntry
} from './manifestAudit';

interface ServiceConfig {
  serviceSchema: string;
  serviceName: string;
  workflows: Array<{
    name: string;
    activities: string[];
  }>;
  // Add other config fields as needed
}

interface WorkerManifest {
  service_schema: string;
  activities_path: string;
  workflows: Array<{
    name: string;
    task_queue: string;
    workflows_path: string;
    activities: string[];
  }>;
}

/**
 * Called when a new service is created in OSP
 * Generates manifest and triggers worker deployment
 */
export async function deployWorkerForService(serviceConfig: ServiceConfig) {
  console.log(`🎯 Starting worker deployment for service: ${serviceConfig.serviceSchema}`);
  
  try {
    // 1. Generate service manifest and store in Supabase
    const manifestId = await generateServiceManifest(serviceConfig);
    console.log(`📄 Generated manifest with ID: ${manifestId}`);
    
    // 2. Trigger automated worker deployment
    const deploymentResult = await queueWorkerBuild(serviceConfig.serviceSchema, manifestId);
    
    if (deploymentResult.success) {
      console.log(`✅ Worker deployment queued successfully for ${serviceConfig.serviceSchema}`);
      return {
        success: true,
        service_schema: serviceConfig.serviceSchema,
        manifest_id: manifestId,
        deployment_id: deploymentResult
      };
    } else {
      console.error(`❌ Worker deployment failed for ${serviceConfig.serviceSchema}`);
      return {
        success: false,
        service_schema: serviceConfig.serviceSchema,
        error: deploymentResult.error
      };
    }
    
  } catch (error) {
    console.error(`💥 Worker integration failed for ${serviceConfig.serviceSchema}:`, error);
    return {
      success: false,
      service_schema: serviceConfig.serviceSchema,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Generates a service manifest and stores it in Supabase with governance
 * Returns the inserted manifest UUID
 */
async function generateServiceManifest(serviceConfig: ServiceConfig): Promise<string> {
  const manifest: WorkerManifest = {
    service_schema: serviceConfig.serviceSchema,
    activities_path: "./workers/generated/service/activities.js", // Generic path
    workflows: serviceConfig.workflows.map(workflow => ({
      name: workflow.name,
      task_queue: `${serviceConfig.serviceSchema}-tasks`,
      workflows_path: `./workflows/service/${workflow.name}.js`, // Generic path
      activities: workflow.activities
    }))
  };
  
  console.log(`📝 Generating manifest for ${serviceConfig.serviceSchema} with governance`);
  
  // 🔐 Prepare manifest data with governance fields
  const manifestData = {
    service_id: serviceConfig.serviceSchema,
    service_name: serviceConfig.serviceName,
    version: 'v1.0.0',
    manifest: manifest,  // Fixed: Use correct column name
    created_at: new Date().toISOString(),
    status: 'active' as ManifestStatus,
    locked_fields: ['service_id', 'schema_name']  // Default locked fields
  };
  
  // 🔐 Enforce governance rules for manifest creation
  const governance = await enforceManifestGovernance('create', manifestData, {
    userId: 'system', // Could be actual user ID in future
    reason: `Service creation for ${serviceConfig.serviceSchema}`
  });
  
  if (!governance.allowed) {
    throw new Error(`Manifest governance violation: ${governance.errors.join(', ')}`);
  }
  
  // Log governance warnings if any
  if (governance.warnings.length > 0) {
    console.warn('⚠️ Governance warnings:', governance.warnings);
  }
  
  // 🔄 Insert manifest using RPC + fallback approach
  let manifestId: string;
  
  try {
    // Try RPC first (bypasses schema cache issues)
    console.log('📡 Attempting RPC insertion to bypass schema cache...');
    const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc('insert_service_manifest', {
      p_service_id: manifestData.service_id,
      p_service_name: manifestData.service_name,
      p_version: manifestData.version,
      p_manifest: manifestData.manifest,  // Fixed: Use correct property name
      p_status: manifestData.status,
      p_locked_fields: manifestData.locked_fields
    });
    
    if (rpcError || !rpcData || rpcData.length === 0) {
      console.warn('📡 RPC method failed, trying direct insert fallback...', rpcError?.message);
      
      // Fallback to direct table insert
      const { data: directData, error: directError } = await supabaseAdmin
        .schema('osp_metadata')
        .from('service_manifests')
        .insert(manifestData)
        .select('id')
        .single();
      
      if (directError || !directData) {
        throw new Error(`Both RPC and direct insert failed. RPC: ${rpcError?.message}, Direct: ${directError?.message}`);
      }
      
      manifestId = directData.id;
      console.log('✅ Direct insert successful (fallback method)');
    } else {
      manifestId = rpcData[0].manifest_id;
      console.log('✅ RPC insert successful (primary method)');
    }
  } catch (insertError) {
    console.error('❌ Manifest insertion completely failed:', insertError);
    throw new Error(`Failed to store manifest in Supabase: ${insertError instanceof Error ? insertError.message : 'Unknown error'}`);
  }
  
  // 📝 Log audit entry for manifest creation
  const auditEntry: AuditLogEntry = {
    action: 'create',
    manifest_id: manifestId,
    changed_by: 'system',
    changed_at: new Date().toISOString(),
    changes: {
      'manifest_creation': {
        before: undefined,
        after: manifestData,
        changeType: 'added'
      }
    },
    reason: `Service creation for ${serviceConfig.serviceSchema}`
  };
  
  await logAuditEntry(auditEntry);
  
  console.log(`✅ Manifest stored with governance: ID=${manifestId}, version=v1.0.0, status=active`);
  return manifestId;
}

/**
 * Health check for deployed workers
 * Can be called periodically to update worker_registry status
 */
export async function checkWorkerHealth(serviceSchema: string) {
  // TODO: Integrate with Temporal health APIs or Railway status
  console.log(`🏥 Health check for worker: ${serviceSchema}`);
  // Implementation depends on Temporal Cloud APIs
}

/**
 * Stop/remove worker deployment
 * For when services are deleted in OSP
 */
export async function removeWorkerForService(serviceSchema: string) {
  console.log(`🗑️ Removing worker for service: ${serviceSchema}`);
  // TODO: Implement worker removal via Railway CLI/API
  // railway service delete ${serviceSchema}-worker
} 