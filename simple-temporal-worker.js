#!/usr/bin/env node

import { Worker } from '@temporalio/worker';
import { Connection } from '@temporalio/client';
import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs'; // ✅ 1. IMPORT THE FILE SYSTEM MODULE

// --- Configuration ---
dotenv.config();

const PORT = process.env.PORT || 3000;
const TASK_QUEUE = 'osp-queue';

const requiredVars = [
  'TEMPORAL_ADDRESS',
  'TEMPORAL_NAMESPACE',
  'TEMPORAL_API_KEY',
];

const missing = requiredVars.filter((v) => !process.env[v]);
if (missing.length > 0) {
  console.error('❌ Missing critical environment variables:', missing);
  process.exit(1);
}

const activities = {
  async createEntityInService(serviceSchema, entityName, data) {
    console.log(`📝 Mock: Would insert into ${serviceSchema}.${entityName} with data:`, data);
    const mockResult = { id: Math.floor(Math.random() * 1000), created_at: new Date().toISOString() };
    console.log(`✅ Mock: Successfully "created" entity:`, mockResult);
    return mockResult;
  }
};

// --- Main Run ---
async function run() {
  console.log('🚀 Starting OSP Temporal Worker...');

  const app = express();
  app.get('/health', (_, res) => {
    res.status(200).json({ status: 'healthy' });
  });

  const healthServer = app.listen(PORT, () => {
    console.log(`🏥 Health check server listening on port ${PORT}`);
  });

  try {
    // ✅ 2. READ THE CERTIFICATE FILES
    const caCert = fs.readFileSync('/app/certs/ca.pem');
    const intermediateCert = fs.readFileSync('/app/certs/ca-intermediate.pem');

    console.log('🔌 Connecting to Temporal Cloud with explicit TLS configuration...');
    const connection = await Connection.connect({
      address: process.env.TEMPORAL_ADDRESS,
      apiKey: process.env.TEMPORAL_API_KEY,
      // ✅ 3. ADD THIS TLS CONFIGURATION BLOCK
      tls: {
        // Pass the CA certificates to trust the Temporal Cloud server
        serverRootCACertificate: Buffer.concat([caCert, intermediateCert]),
        // Provide the server name for SNI, matching the certificate
        serverNameOverride: process.env.TEMPORAL_ADDRESS.split(':')[0],
      },
    });
    console.log('✅ Connected to Temporal Cloud successfully!');

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const workflowsPath = path.join(__dirname, 'workflows.js');

    console.log('👷 Creating Temporal worker...');
    const worker = await Worker.create({
      connection,
      namespace: process.env.TEMPORAL_NAMESPACE,
      taskQueue: TASK_QUEUE,
      workflowsPath,
      activities,
    });
    console.log('✅ Worker created successfully.');

    // Graceful shutdown handling
    const shutdown = async () => { /* ... your shutdown logic ... */ };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

    console.log(`🏃 Starting worker on task queue: ${TASK_QUEUE}...`);
    // ✅ 4. RUN THE WORKER NORMALLY
    await worker.run();

  } catch (error) {
    console.error('❌ Failed to start worker:', error);
    healthServer.close();
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('❌ Failed to start application:', err);
  process.exit(1);
});