import { exec } from 'child_process';
import { promisify } from 'util';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { 
  createRailwayService, 
  getRailwayServiceId, 
  setRailwayEnvironmentVariables,
  deployRailwayService,
  deleteRailwayService 
} from './railwayService.js';

// Load environment variables
dotenv.config();

const execAsync = promisify(exec);

// Sanity check for missing environment variables
if (!process.env.PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase environment variables. Aborting.');
  console.error('Expected: PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Initialize Supabase client for worker registry tracking
const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function queueWorkerBuild(service_schema, manifest_id, retryCount = 0) {
  console.log(`🚀 Deploying worker for: ${service_schema} (attempt ${retryCount + 1})`);
  console.log(`📋 Using manifest ID: ${manifest_id}`);
  
  const maxRetries = 3;
  let railwayServiceId = null;
  
  // Log deployment attempt to worker_registry
  const { data: registryEntry, error: insertError } = await supabase
    .from('worker_registry')
    .insert({
      service_schema,
      manifest_path: `supabase:${manifest_id}`, // Store manifest ID with prefix
      deployment_status: 'deploying',
      logs: `Started deployment attempt ${retryCount + 1}`
    })
    .select()
    .single();

  if (insertError) {
    console.error('❌ Failed to log deployment attempt:', insertError);
  }

  try {
    // Step 1: Check if Railway service exists or create it
    console.log(`🔍 Checking for existing Railway service...`);
    railwayServiceId = await getRailwayServiceId(service_schema);
    
    if (!railwayServiceId) {
      console.log(`📦 No existing service found, creating new Railway service...`);
      railwayServiceId = await createRailwayService(service_schema);
      
      // Update the services table with Railway service ID
      const { error: updateError } = await supabase
        .from('services')
        .update({ railway_service_id: railwayServiceId })
        .eq('service_schema', service_schema);
      
      if (updateError) {
        console.warn('⚠️ Failed to update Railway service ID in database:', updateError);
      }
    } else {
      console.log(`✅ Found existing Railway service: ${railwayServiceId}`);
    }
    
    // Step 2: Set all required environment variables
    console.log(`📝 Setting environment variables...`);
    const envVars = {
      MANIFEST_ID: manifest_id,
      TEMPORAL_CLOUD_ENDPOINT: process.env.TEMPORAL_CLOUD_ENDPOINT,
      TEMPORAL_API_KEY: process.env.TEMPORAL_API_KEY,
      TEMPORAL_CLOUD_NAMESPACE: process.env.TEMPORAL_CLOUD_NAMESPACE,
      PUBLIC_SUPABASE_URL: process.env.PUBLIC_SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY
    };
    
    // Check for missing env vars before setting
    const missingVars = Object.entries(envVars)
      .filter(([key, value]) => !value)
      .map(([key]) => key);
    
    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }
    
    await setRailwayEnvironmentVariables(railwayServiceId, envVars);
    
    // Step 3: Deploy the service
    console.log(`🚢 Deploying Railway service...`);
    const deploymentId = await deployRailwayService(railwayServiceId);
    
    console.log(`✅ Deployment successful for ${service_schema}`);
    console.log(`📋 Railway Service ID: ${railwayServiceId}`);
    console.log(`📋 Deployment ID: ${deploymentId}`);
    
    // Update registry with success
    if (registryEntry) {
      await supabase
        .from('worker_registry')
        .update({
          deployment_status: 'deployed',
          railway_service_id: railwayServiceId,
          logs: `Deployment successful. Service ID: ${railwayServiceId}, Deployment ID: ${deploymentId}`
        })
        .eq('id', registryEntry.id);
    }
    
    return { 
      success: true, 
      service_schema, 
      railway_service_id: railwayServiceId,
      deployment_id: deploymentId 
    };
    
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
      return queueWorkerBuild(service_schema, manifest_id, retryCount + 1);
    } else {
      console.error(`💥 Max retries exceeded for ${service_schema}. Manual intervention required.`);
      
      // Rollback: Delete the Railway service if it was created
      if (railwayServiceId && retryCount === 0) {
        console.log(`🔄 Rolling back - deleting Railway service...`);
        await deleteRailwayService(railwayServiceId);
      }
      
      return { success: false, service_schema, error: errorMessage };
    }
  }
} 