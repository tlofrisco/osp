#!/usr/bin/env node

import { Worker } from '@temporalio/worker';
import { Connection } from '@temporalio/client';
import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

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

async function run() {
  console.log('🚀 Starting OSP Temporal Worker...');

  const app = express();
  app.get('/health', (_, res) => {
    res.status(200).json({ status: 'healthy', worker: 'running' });
  });
  const healthServer = app.listen(PORT, () => {
    console.log(`🏥 Health check server listening on port ${PORT}`);
  });

  try {
    // ✅ Load only root CA cert (simplified and valid for Temporal Cloud)
    const caCertPath = '/app/certs/ca.pem';

    if (!fs.existsSync(caCertPath)) {
      throw new Error(`❌ Missing CA certificate: ${caCertPath}`);
    }

    const caCert = fs.readFileSync(caCertPath);
    console.log(`🔐 CA cert length: ${caCert.length}`);

    // ✅ Derive SNI value from TEMPORAL_ADDRESS
    const sniHost = process.env.TEMPORAL_ADDRESS.split(':')[0];
    console.log(`ℹ️  Using SNI override value: ${sniHost}`);
    console.log(`🔌 Connecting to Temporal Cloud with explicit TLS and timeout...`);

    const connection = await Connection.connect({
      address: process.env.TEMPORAL_ADDRESS,
      apiKey: process.env.TEMPORAL_API_KEY,
      connectTimeout: '30s',
      tls: {
        serverRootCACertificate: caCert,
        serverNameOverride: sniHost,
      },
    });

    console.log('✅ Connected to Temporal Cloud successfully!');

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const workflowsPath = path.join(__dirname, 'workflows.js');
    console.log('📁 Workflows path:', workflowsPath);

    const worker = await Worker.create({
      connection,
      namespace: process.env.TEMPORAL_NAMESPACE,
      taskQueue: TASK_QUEUE,
      workflowsPath,
      activities,
    });

    console.log(`👷 Worker created. Running on task queue: ${TASK_QUEUE}...`);
    await worker.run();

  } catch (error) {
    console.error('❌ Failed to start worker:', error);
    if (error.code) console.error('📛 Error Code:', error.code);
    if (error.details) console.error('📎 Error Details:', error.details);
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('❌ Unhandled application error:', err);
  process.exit(1);
});
