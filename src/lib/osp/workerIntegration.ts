/**
 * 🔗 OSP Worker Integration
 * 
 * Connects OSP service creation to automated worker deployment.
 * Called automatically when services are created via OSP UI.
 */

import { queueWorkerBuild } from '../../../workers/queueWorkerBuild';
import { supabaseAdmin } from '$lib/supabaseAdmin';

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
 * Generates a service manifest and stores it in Supabase
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
  
  console.log(`📝 Storing manifest for ${serviceConfig.serviceSchema} in Supabase:`, manifest);
  
  // Insert manifest into Supabase service_manifests table
  const { data, error } = await supabaseAdmin
    .schema('osp_metadata')
    .from('service_manifests')
    .insert({
      service_id: serviceConfig.serviceSchema,
      service_name: serviceConfig.serviceName,
      manifest_content: manifest,
      created_at: new Date().toISOString(),
      status: 'active'
    })
    .select('id')
    .single();
  
  if (error) {
    throw new Error(`Failed to store manifest in Supabase: ${error.message}`);
  }
  
  console.log(`📄 Manifest stored in Supabase with ID: ${data.id}`);
  return data.id;
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