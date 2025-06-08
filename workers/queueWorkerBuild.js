import { exec } from 'child_process';
import { promisify } from 'util';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from parent directory
dotenv.config({ path: path.join(process.cwd(), '../.env') });

const execAsync = promisify(exec);

// Initialize Supabase client for worker registry tracking
const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function queueWorkerBuild(service_schema, retryCount = 0) {
  console.log(`🚀 Deploying worker for: ${service_schema} (attempt ${retryCount + 1})`);
  
  const manifestPath = `manifests/${service_schema}.json`;
  const maxRetries = 3;
  
  // Log deployment attempt to worker_registry
  const { data: registryEntry, error: insertError } = await supabase
    .from('worker_registry')
    .insert({
      service_schema,
      manifest_path: manifestPath,
      deployment_status: 'deploying',
      logs: `Started deployment attempt ${retryCount + 1}`
    })
    .select()
    .single();

  if (insertError) {
    console.error('❌ Failed to log deployment attempt:', insertError);
  }

  try {
    const setEnvCmd = `railway variables --set "MANIFEST_PATH=${manifestPath}"`;
    const deployCmd = `railway up`;
    
    console.log(`📝 Setting MANIFEST_PATH: ${manifestPath}`);
    console.log(`🚢 Executing: ${setEnvCmd} && ${deployCmd}`);
    
    const { stdout, stderr } = await execAsync(`${setEnvCmd} && ${deployCmd}`);
    
    console.log(`✅ Deployment successful for ${service_schema}`);
    console.log(`📋 Deployment logs:\n${stdout}`);
    
    // Update registry with success
    if (registryEntry) {
      await supabase
        .from('worker_registry')
        .update({
          deployment_status: 'deployed',
          logs: `Deployment successful:\n${stdout}`
        })
        .eq('id', registryEntry.id);
    }
    
    return { success: true, service_schema, logs: stdout };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ Deployment failed for ${service_schema}:`, errorMessage);
    
    // Update registry with failure
    if (registryEntry) {
      await supabase
        .from('worker_registry')
        .update({
          deployment_status: 'failed',
          logs: `Deployment failed (attempt ${retryCount + 1}):\n${errorMessage}`
        })
        .eq('id', registryEntry.id);
    }
    
    // Retry mechanism
    if (retryCount < maxRetries) {
      console.log(`🔄 Retrying deployment for ${service_schema} (${retryCount + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      return queueWorkerBuild(service_schema, retryCount + 1);
    } else {
      console.error(`💥 Max retries exceeded for ${service_schema}. Manual intervention required.`);
      
      // TODO: Future - Send Slack/webhook alert for critical deployment failures
      // await sendDeploymentFailureAlert(service_schema, errorMessage);
      
      return { success: false, service_schema, error: errorMessage };
    }
  }
} 