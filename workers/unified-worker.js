#!/usr/bin/env node

/**
 * 🚀 Unified OSP Temporal Worker
 * 
 * Single worker that handles ALL service types (restaurant, hotel, etc.)
 * No need for separate Railway services per service type.
 * 
 * This worker:
 * 1. Listens to a unified task queue: "osp-unified-queue"
 * 2. Dynamically handles workflows for any service type
 * 3. Uses service_schema from workflow input to determine behavior
 */

import { Worker } from '@temporalio/worker';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Import activities and workflows
import * as activities from './activities.js';
import * as workflows from './workflows.js';

dotenv.config();

console.log('🚀 Starting Unified OSP Temporal Worker...');
console.log('🕒 Timestamp:', new Date().toISOString());

// Validate environment variables
const requiredEnvVars = [
  'TEMPORAL_CLOUD_ENDPOINT',
  'TEMPORAL_API_KEY', 
  'TEMPORAL_CLOUD_NAMESPACE',
  'PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars);
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Unified task queue for all service types
const UNIFIED_TASK_QUEUE = 'osp-unified-queue';

async function startUnifiedWorker() {
  try {
    console.log('🔧 Configuring Unified Temporal Worker...');
    console.log(`📡 Endpoint: ${process.env.TEMPORAL_CLOUD_ENDPOINT}`);
    console.log(`🏢 Namespace: ${process.env.TEMPORAL_CLOUD_NAMESPACE}`);
    console.log(`📋 Unified Task Queue: ${UNIFIED_TASK_QUEUE}`);
    
    // Create the worker
    const worker = await Worker.create({
      connection: {
        address: process.env.TEMPORAL_CLOUD_ENDPOINT,
        tls: {}, // Use default TLS (API key is handled by Temporal Cloud)
      },
      namespace: process.env.TEMPORAL_CLOUD_NAMESPACE,
      taskQueue: UNIFIED_TASK_QUEUE,
      workflowsPath: new URL('./workflows.js', import.meta.url).pathname,
      activities,
      maxConcurrentActivityTaskExecutions: 20,
      maxConcurrentWorkflowTaskExecutions: 20,
    });

    console.log('✅ Unified Temporal Worker configured successfully!');
    console.log('🎯 This worker handles ALL service types:');
    console.log('   • Restaurant reservations');
    console.log('   • Hotel bookings'); 
    console.log('   • Any future service types');
    console.log('   • Dynamic service_schema-based routing');
    
    // Log worker startup to database
    const { error: logError } = await supabase
      .from('worker_registry')
      .insert({
        service_schema: 'unified-worker',
        manifest_path: 'unified-all-services',
        deployment_status: 'running',
        railway_service_id: process.env.RAILWAY_SERVICE_ID || 'unified-service',
        logs: `🚀 Unified Temporal Worker started successfully\nTask Queue: ${UNIFIED_TASK_QUEUE}\nEndpoint: ${process.env.TEMPORAL_CLOUD_ENDPOINT}\nNamespace: ${process.env.TEMPORAL_CLOUD_NAMESPACE}\nHandles: ALL service types dynamically`
      });

    if (logError) {
      console.warn('⚠️ Failed to log worker startup:', logError);
    }

    // Start the worker
    console.log('🏃 Starting unified worker execution...');
    console.log('📡 Listening for workflows from ALL service types...');
    await worker.run();
    
  } catch (error) {
    console.error('❌ Failed to start Unified Temporal Worker:', error);
    
    // Log failure to database
    await supabase
      .from('worker_registry')
      .insert({
        service_schema: 'unified-worker',
        manifest_path: 'unified-all-services',
        deployment_status: 'failed',
        logs: `❌ Unified worker startup failed: ${error.message}`
      });
    
    process.exit(1);
  }
}

// Graceful shutdown handlers
process.on('SIGINT', async () => {
  console.log('🛑 Received SIGINT, shutting down unified worker gracefully...');
  await supabase
    .from('worker_registry')
    .insert({
      service_schema: 'unified-worker',
      manifest_path: 'unified-all-services',
      deployment_status: 'stopped',
      logs: '🛑 Unified worker shutdown gracefully via SIGINT'
    });
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🛑 Received SIGTERM, shutting down unified worker gracefully...');
  await supabase
    .from('worker_registry')
    .insert({
      service_schema: 'unified-worker',
      manifest_path: 'unified-all-services',
      deployment_status: 'stopped',
      logs: '🛑 Unified worker shutdown gracefully via SIGTERM'
    });
  process.exit(0);
});

// Start the unified worker
startUnifiedWorker().catch(error => {
  console.error('💥 Unhandled error in unified worker:', error);
  process.exit(1);
}); 