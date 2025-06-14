#!/usr/bin/env node

import { Worker } from '@temporalio/worker';
// import { createClient } from '@supabase/supabase-js'; // Commented out for now
import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// --- Configuration ---
dotenv.config();

const PORT = process.env.PORT || 3000;
const TASK_QUEUE = 'osp-queue';

const requiredVars = [
  'TEMPORAL_ADDRESS',
  'TEMPORAL_NAMESPACE',
  'TEMPORAL_API_KEY',
  // Commenting out Supabase vars for now
  // 'PUBLIC_SUPABASE_URL',
  // 'SUPABASE_SERVICE_ROLE_KEY'
];
const missing = requiredVars.filter((v) => !process.env[v]);
if (missing.length > 0) {
  console.error('❌ Missing critical environment variables:', missing);
  process.exit(1);
}

// ✅ Supabase admin client (commented out for now)
// const supabaseAdmin = createClient(
//   process.env.PUBLIC_SUPABASE_URL,
//   process.env.SUPABASE_SERVICE_ROLE_KEY
// );

// ✅ Activities (with mock implementation)
const activities = {
  async createEntityInService(serviceSchema, entityName, data) {
    console.log(`📝 Mock: Would insert into ${serviceSchema}.${entityName} with data:`, data);

    // 🔥 MOCK IMPLEMENTATION - Replace with real Supabase call later
    // const { data: result, error } = await supabaseAdmin
    //   .rpc('insert_into_dynamic_table', { service_schema: serviceSchema, table_name: entityName, row_data: data })
    //   .single();

    // if (error) {
    //   console.error(`❌ Supabase insert failed for ${serviceSchema}.${entityName}:`, error);
    //   throw error;
    // }
    
    // Mock successful result
    const mockResult = {
      id: Math.floor(Math.random() * 1000),
      serviceSchema,
      entityName,
      data,
      created_at: new Date().toISOString()
    };
    
    console.log(`✅ Mock: Successfully "created" entity:`, mockResult);
    return mockResult;
  }
};

// --- Main Run ---
async function run() {
  // Health check server
  const app = express();
  const healthServer = app.listen(PORT, () =>
    console.log(`🏥 Health check server listening on port ${PORT}`)
  );
  app.get('/health', (_, res) => res.status(200).send('OK'));

  // Temporal Worker
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const workflowsPath = path.join(__dirname, 'workflows.js');

  const worker = await Worker.create({
    connection: {
      address: process.env.TEMPORAL_ADDRESS,
      apiKey: process.env.TEMPORAL_API_KEY,
    },
    namespace: process.env.TEMPORAL_NAMESPACE,
    taskQueue: TASK_QUEUE,
    workflowsPath,
    activities,
    maxConcurrentActivityTaskExecutions: 10,
    maxConcurrentWorkflowTaskExecutions: 10,
  });

  const shutdown = async () => {
    console.log('🛑 Shutting down gracefully...');
    await worker.shutdown();
    healthServer.close(() => console.log('🔌 Health server shut down.'));
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  try {
    console.log('🏃 Worker configured successfully! Starting execution...');
    await worker.run();
  } catch (err) {
    console.error('❌ Worker crashed:', err);
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('❌ Failed to start application:', err);
  process.exit(1);
});
