#!/usr/bin/env node

/**
 * Clean OSP Temporal Worker
 * 
 * Based on Temporal + Railway industry standards
 * Simple, direct approach with zero custom abstractions
 */

import { Worker } from '@temporalio/worker';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

dotenv.config();

console.log('🚀 Starting Clean OSP Temporal Worker...');

// Simple environment validation
const requiredVars = [
  'TEMPORAL_ADDRESS',
  'TEMPORAL_NAMESPACE', 
  'TEMPORAL_API_KEY',
  'PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY'
];

const missing = requiredVars.filter(v => !process.env[v]);
if (missing.length > 0) {
  console.error('❌ Missing environment variables:', missing);
  process.exit(1);
}

// Simple Supabase client
const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Simple activities (minimal example)
const activities = {
  async createEntity(data) {
    console.log('📝 Creating entity:', data);
    
    const { data: result, error } = await supabase
      .from('services')
      .insert(data)
      .select()
      .single();
    
    if (error) throw error;
    return result;
  }
};

// Simple workflows
const workflows = `
import { proxyActivities } from '@temporalio/workflow';

const { createEntity } = proxyActivities({
  startToCloseTimeout: '30s',
});

export async function createServiceWorkflow(serviceData) {
  return await createEntity(serviceData);
}
`;

async function main() {
  try {
    console.log('🔧 Connecting to Temporal...');
    console.log(`📡 Address: ${process.env.TEMPORAL_ADDRESS}`);
    console.log(`🏢 Namespace: ${process.env.TEMPORAL_NAMESPACE}`);
    
    // ES modules path resolution
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const workflowsPath = path.join(__dirname, 'workflows.js');
    
    const worker = await Worker.create({
      connection: {
        address: process.env.TEMPORAL_ADDRESS,
        tls: {
          clientCertPair: undefined
        },
        apiKey: process.env.TEMPORAL_API_KEY
      },
      namespace: process.env.TEMPORAL_NAMESPACE,
      taskQueue: 'osp-queue',
      workflowsPath: workflowsPath,
      activities,
      maxConcurrentActivityTaskExecutions: 10,
      maxConcurrentWorkflowTaskExecutions: 10,
    });

    console.log('✅ Worker configured successfully!');
    console.log('🏃 Starting worker execution...');
    
    await worker.run();
    
  } catch (error) {
    console.error('❌ Worker failed:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Shutting down gracefully...');
  process.exit(0);
});

main(); 