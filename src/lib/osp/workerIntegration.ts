/**
 * 🔗 OSP Worker Integration
 * 
 * Connects OSP service creation to automated worker deployment.
 * Called automatically when services are created via OSP UI.
 */

import { queueWorkerBuild } from '../../../workers/queueWorkerBuild';
import fs from 'fs/promises';
import path from 'path';

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
    // 1. Generate service manifest
    const manifestPath = await generateServiceManifest(serviceConfig);
    console.log(`📄 Generated manifest: ${manifestPath}`);
    
    // 2. Trigger automated worker deployment
    const deploymentResult = await queueWorkerBuild(serviceConfig.serviceSchema);
    
    if (deploymentResult.success) {
      console.log(`✅ Worker deployment queued successfully for ${serviceConfig.serviceSchema}`);
      return {
        success: true,
        service_schema: serviceConfig.serviceSchema,
        manifest_path: manifestPath,
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
 * Generates a service manifest based on OSP service configuration
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
  
  // Ensure manifests directory exists
  const manifestsDir = path.join(process.cwd(), 'manifests');
  await fs.mkdir(manifestsDir, { recursive: true });
  
  // Write manifest file
  const manifestPath = path.join(manifestsDir, `${serviceConfig.serviceSchema}.json`);
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  
  console.log(`📝 Manifest generated for ${serviceConfig.serviceSchema}:`, manifest);
  return manifestPath;
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