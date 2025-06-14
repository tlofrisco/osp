#!/usr/bin/env node

import { Worker } from '@temporalio/worker';
import { Connection } from '@temporalio/client';
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
  console.log('🚀 Starting OSP Temporal Worker...');
  
  // Health check server FIRST
  const app = express();
  app.get('/health', (_, res) => {
    console.log('🏥 Health check requested');
    res.status(200).json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      worker: 'initializing'
    });
  });
  
  const healthServer = app.listen(PORT, () => {
    console.log(`🏥 Health check server listening on port ${PORT}`);
  });

  try {
    // Create connection with proper error handling
    console.log('🔌 Connecting to Temporal Cloud...');
    const connection = await Connection.connect({
      address: process.env.TEMPORAL_ADDRESS,
      apiKey: process.env.TEMPORAL_API_KEY,
    });
    console.log('✅ Connected to Temporal Cloud successfully');

    // Get current directory for workflows
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const workflowsPath = path.join(__dirname, 'workflows.js');
    
    console.log('📁 Workflows path:', workflowsPath);

    // Create worker with connection
    console.log('👷 Creating Temporal worker...');
    const worker = await Worker.create({
      connection,
      namespace: process.env.TEMPORAL_NAMESPACE,
      taskQueue: TASK_QUEUE,
      workflowsPath,
      activities,
      maxConcurrentActivityTaskExecutions: 5,
      maxConcurrentWorkflowTaskExecutions: 5,
      // Add some additional configuration for stability
      shutdownGraceTimeMs: 10000,
      maxHeartbeatThrottleIntervalMs: 60000,
      defaultHeartbeatThrottleIntervalMs: 30000,
    });

    console.log('✅ Worker created successfully');

    // Update health check to show worker is ready
    app.get('/health', (_, res) => {
      res.status(200).json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        worker: 'running',
        taskQueue: TASK_QUEUE,
        namespace: process.env.TEMPORAL_NAMESPACE
      });
    });

    // Graceful shutdown handling
    const shutdown = async () => {
      console.log('🛑 Shutting down gracefully...');
      try {
        await worker.shutdown();
        console.log('✅ Worker shut down successfully');
        
        healthServer.close(() => {
          console.log('🔌 Health server shut down');
          process.exit(0);
        });
      } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    process.on('SIGQUIT', shutdown);

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('💥 Uncaught Exception:', error);
      shutdown();
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
      shutdown();
    });

    console.log('🏃 Starting worker execution...');
    console.log(`📋 Task Queue: ${TASK_QUEUE}`);
    console.log(`🌐 Namespace: ${process.env.TEMPORAL_NAMESPACE}`);
    console.log(`🏠 Address: ${process.env.TEMPORAL_ADDRESS}`);
    
    // 🛑 TEMPORARILY COMMENT OUT THE WORKER RUN COMMAND
    // await worker.run();
    
    // ✅ ADD THIS LINE TO KEEP THE CONTAINER ALIVE FOR DEBUGGING
    await new Promise(() => {}); // This creates a promise that never resolves, keeping the Node.js process alive

  } catch (error) {
    console.error('❌ Failed to start worker:', error);
    
    // Log more details about the error
    if (error.code) {
      console.error('Error Code:', error.code);
    }
    if (error.details) {
      console.error('Error Details:', error.details);
    }
    
    healthServer.close();
    process.exit(1);
  }
}

// Start the application
run().catch((err) => {
  console.error('❌ Failed to start application:', err);
  process.exit(1);
});