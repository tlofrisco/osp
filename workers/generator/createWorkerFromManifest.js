import { Worker } from '@temporalio/worker';
import { Connection } from '@temporalio/client';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import fs from 'fs/promises';
import dotenv from 'dotenv';

// Load environment variables - supports both .env and .env.production
dotenv.config();
dotenv.config({ path: path.join(process.cwd(), '../.env') }); // Load from parent directory
if (process.env.NODE_ENV === 'production') {
  dotenv.config({ path: '.env.production' });
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

export async function createWorkerFromManifest(manifestInput) {
  let manifest;
  let serviceSchema;
  
  // Support both manifest object and path for flexibility
  if (typeof manifestInput === 'string') {
    console.log(`🔄 Loading service manifest from path: ${manifestInput}`);
    const fullPath = path.resolve(manifestInput);
    const manifestRaw = await fs.readFile(fullPath, 'utf-8');
    manifest = JSON.parse(manifestRaw);
  } else {
    console.log(`🔄 Using provided manifest object`);
    manifest = manifestInput;
  }
  
  try {
    const { service_schema, workflows, activities_path } = manifest;
    serviceSchema = service_schema;
    const taskQueue = workflows[0]?.task_queue || `${service_schema}-tasks`;

    console.log(`🔁 Spawning worker for service schema: ${service_schema}`);
    console.log(`📌 Task Queue: ${taskQueue}`);
    console.log(`⚙️ Workflows to load:`, workflows.map(w => w.name));

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