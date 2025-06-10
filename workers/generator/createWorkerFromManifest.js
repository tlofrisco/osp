import { Worker } from '@temporalio/worker';
import { Connection } from '@temporalio/client';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Sanity check for missing environment variables
if (!process.env.PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase environment variables. Aborting.');
  console.error('Expected: PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Initialize Supabase for worker status logging
const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Log worker status to Supabase worker_registry
 */
async function logWorkerStatus(serviceSchema, status, message) {
  try {
    await supabase
      .from('worker_registry')
      .update({
        deployment_status: status,
        logs: message,
        last_health_check: new Date().toISOString()
      })
      .eq('service_schema', serviceSchema);
    
    console.log(`📝 Logged to Supabase: ${status} - ${serviceSchema}`);
  } catch (error) {
    console.error('⚠️ Failed to log to Supabase:', error.message);
  }
}

/**
 * 🔍 Fetch manifest from Supabase using manifest UUID (v4.0 - Governance)
 * 
 * Enhanced with governance validation and deployment status checking.
 * Part of OSP Refactor Sets 04+05+07: Governance, Locking, and Auditability
 */
async function fetchManifestFromSupabase(manifestId) {
  try {
    const { data, error } = await supabase
      .schema('osp_metadata')
      .from('service_manifests')
      .select('id, service_id, service_name, version, status, manifest, created_at, locked_fields')
      .eq('id', manifestId)
      .single();
    
    if (error) {
      throw new Error(`Failed to fetch manifest: ${error.message}`);
    }
    
    if (!data) {
      throw new Error(`Manifest not found with ID: ${manifestId}`);
    }
    
    // 🔐 GOVERNANCE: Validate manifest status for deployment
    if (data.status === 'draft') {
      throw new Error(`❌ Cannot deploy draft manifest ${manifestId}. Manifest must be 'active' for live deployment.`);
    }
    
    if (data.status === 'deprecated') {
      console.warn(`⚠️ CAUTION: Deploying deprecated manifest ${manifestId}. Consider updating to latest version.`);
    }
    
    if (data.status === 'locked') {
      console.warn(`🔒 Deploying locked manifest ${manifestId} - this version cannot be modified.`);
    }
    
    if (data.status !== 'active' && data.status !== 'locked') {
      console.warn(`⚠️ Manifest ${manifestId} has status: ${data.status}. Only 'active' manifests are recommended for production.`);
    }
    
    console.log(`✅ Fetched manifest from Supabase (GOVERNANCE VALIDATED):`);
    console.log(`   📄 ID: ${data.id}`);
    console.log(`   🏷️  Service: ${data.service_id}`);
    console.log(`   📦 Version: ${data.version || 'unversioned'}`);
    console.log(`   🟢 Status: ${data.status} ${data.status === 'active' ? '✅' : data.status === 'locked' ? '🔒' : '⚠️'}`);
    console.log(`   🔐 Locked Fields: ${data.locked_fields ? data.locked_fields.join(', ') : 'none'}`);
    console.log(`   📅 Created: ${data.created_at}`);
    
    // Return both the manifest content and metadata for governance logging
    return {
      content: data.manifest,
      metadata: {
        id: data.id,
        service_id: data.service_id,
        status: data.status,
        version: data.version,
        locked_fields: data.locked_fields
      }
    };
  } catch (error) {
    console.error(`❌ Error fetching manifest from Supabase:`, error);
    throw error;
  }
}

export async function createWorkerFromManifest(manifestInput) {
  let manifest;
  let manifestMetadata;
  let serviceSchema;
  
  // Support both manifest object and manifest ID
  if (typeof manifestInput === 'string') {
    console.log(`🔄 Loading service manifest from Supabase ID: ${manifestInput}`);
    const manifestData = await fetchManifestFromSupabase(manifestInput);
    manifest = manifestData.content;
    manifestMetadata = manifestData.metadata;
  } else {
    console.log(`🔄 Using provided manifest object`);
    manifest = manifestInput;
    manifestMetadata = null; // No metadata for direct manifest objects
  }
  
  try {
    const { service_schema, workflows, activities_path } = manifest;
    serviceSchema = service_schema;
    const taskQueue = workflows[0]?.task_queue || `${service_schema}-tasks`;

    console.log(`🔁 Spawning worker for service schema: ${service_schema}`);
    console.log(`📌 Task Queue: ${taskQueue}`);
    console.log(`⚙️ Workflows to load:`, workflows.map(w => w.name));
    
    // 🔐 Log governance information if available
    if (manifestMetadata) {
      console.log(`🔐 GOVERNANCE INFO:`);
      console.log(`   📄 Manifest ID: ${manifestMetadata.id}`);
      console.log(`   📦 Version: ${manifestMetadata.version || 'unversioned'}`);
      console.log(`   🟢 Status: ${manifestMetadata.status}`);
      console.log(`   🔒 Locked Fields: ${manifestMetadata.locked_fields ? manifestMetadata.locked_fields.join(', ') : 'none'}`);
    }

    // Log worker startup to Supabase
    await logWorkerStatus(serviceSchema, 'starting', `Worker initializing for service: ${serviceSchema}\nTask Queue: ${taskQueue}\nWorkflows: ${workflows.map(w => w.name).join(', ')}`);

    // Validate environment - support both naming conventions
    const temporalEndpoint = process.env.TEMPORAL_CLOUD_ENDPOINT || process.env.TEMPORAL_CLOUD_ADDRESS;
    const temporalApiKey = process.env.TEMPORAL_API_KEY;
    const temporalNamespace = process.env.TEMPORAL_CLOUD_NAMESPACE;
    
    if (!temporalEndpoint || !temporalApiKey || !temporalNamespace) {
      const errorMsg = 'Missing required Temporal Cloud environment variables: TEMPORAL_CLOUD_ENDPOINT/ADDRESS, TEMPORAL_API_KEY, TEMPORAL_CLOUD_NAMESPACE';
      await logWorkerStatus(serviceSchema, 'failed', errorMsg);
      throw new Error(errorMsg);
    }

    // ✅ Required Log: Connecting to Temporal
    console.log('🌐 Connecting to Temporal...');
    console.log(`   Endpoint: ${temporalEndpoint}`);
    console.log(`   Namespace: ${temporalNamespace}`);
    
    const connection = await Connection.connect({
      address: temporalEndpoint,
      tls: true,
      apiKey: temporalApiKey,
      metadata: {
        'temporal-namespace': temporalNamespace,
      },
    });
    
    console.log('✅ Connected to Temporal Cloud');
    await logWorkerStatus(serviceSchema, 'connected', `Successfully connected to Temporal Cloud\nEndpoint: ${temporalEndpoint}\nNamespace: ${temporalNamespace}`);

    // Load activities module
    console.log(`📦 Loading activities from: ${activities_path}`);
    const activitiesPath = path.resolve(activities_path);
    const activitiesModule = await import(`file://${activitiesPath}`);
    const activities = activitiesModule.default || activitiesModule;
    console.log(`✅ Loaded ${Object.keys(activities).length} activities:`, Object.keys(activities));

    // Load workflows dynamically
    console.log('🔄 Loading workflows...');
    const loadedWorkflows = {};
    
    for (const wf of workflows) {
      try {
        console.log(`  📥 Loading workflow: ${wf.name} from ${wf.workflows_path}`);
        const workflowPath = path.resolve(wf.workflows_path);
        const wfModule = await import(`file://${workflowPath}`);
        
        // Try to find the workflow function by name, or use default export
        const workflowFn = wfModule[wf.name] || wfModule.default;
        
        if (!workflowFn) {
          throw new Error(`Workflow function '${wf.name}' not found in ${wf.workflows_path}`);
        }
        
        loadedWorkflows[wf.name] = workflowFn;
        console.log(`  ✅ Loaded workflow: ${wf.name}`);
        
      } catch (error) {
        console.error(`  ❌ Failed to load workflow ${wf.name}:`);
        console.error(`     Error: ${error.message}`);
        console.error(`     Stack: ${error.stack}`);
        
        await logWorkerStatus(serviceSchema, 'failed', `Failed to load workflow ${wf.name}: ${error.message}\nStack: ${error.stack}`);
        throw error;
      }
    }

    // Create and start worker
    console.log('⚙️ Creating Temporal worker...');
    const worker = await Worker.create({
      connection,
      namespace: temporalNamespace,
      taskQueue,
      activities,
      workflows: loadedWorkflows
    });

    console.log(`🚀 Worker ready for service: ${service_schema}`);
    console.log(`📋 Registered workflows: ${Object.keys(loadedWorkflows).join(', ')}`);
    console.log(`⚙️ Registered activities: ${Object.keys(activities).join(', ')}`);
    
    // ✅ Required Log: Listening on task queue
    console.log(`📡 Listening on task queue: ${taskQueue}`);
    
    // ✅ Required Log: Worker successfully started
    console.log(`👂 Worker successfully started`);
    
    // Log successful startup to Supabase
    const successMessage = `Worker successfully started for service: ${service_schema}
Task Queue: ${taskQueue}
Registered Workflows: ${Object.keys(loadedWorkflows).join(', ')}
Registered Activities: ${Object.keys(activities).join(', ')}
Started at: ${new Date().toISOString()}`;
    
    await logWorkerStatus(serviceSchema, 'running', successMessage);
    
    console.log('🔥 Worker is now running and ready to process workflows!');
    
    // Start the worker (this runs indefinitely)
    await worker.run();
    
  } catch (error) {
    console.error('❌ Worker creation failed:');
    console.error('   Error:', error.message);
    console.error('   Stack:', error.stack);
    
    // Log failure to Supabase
    if (serviceSchema) {
      await logWorkerStatus(serviceSchema, 'failed', `Worker creation failed: ${error.message}\nStack: ${error.stack}`);
    }
    
    // Don't swallow errors - re-throw for proper handling
    throw error;
  }
}

// Export for use in launch scripts
export default createWorkerFromManifest; 