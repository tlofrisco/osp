#!/usr/bin/env node

/**
 * 🚀 OSP Worker Launcher
 * 
 * Production-ready script to launch Temporal workers from service manifests.
 * Designed for cloud deployment with comprehensive logging and error handling.
 * 
 * Usage: node launch-worker.js <manifest-path>
 * Example: node launch-worker.js manifests/service_[ID].json
 */

import { createWorkerFromManifest } from './generator/createWorkerFromManifest.js';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '../.env') });

// Initialize Supabase for logging
const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

let currentServiceSchema = null;

// 🚨 Process-level error handlers - No silent failures!
process.on('uncaughtException', async (err) => {
  console.error('🚨 UNCAUGHT EXCEPTION:');
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);
  
  await logToSupabase('failed', `UNCAUGHT EXCEPTION: ${err.message}\nStack: ${err.stack}`);
  process.exit(1);
});

process.on('unhandledRejection', async (reason, promise) => {
  console.error('🚨 UNHANDLED REJECTION:');
  console.error('Reason:', reason);
  console.error('Promise:', promise);
  
  const errorMessage = reason instanceof Error ? reason.stack : String(reason);
  await logToSupabase('failed', `UNHANDLED REJECTION: ${errorMessage}`);
  process.exit(1);
});

// 🔄 SIGTERM handler for graceful shutdown
process.on('SIGTERM', async () => {
  console.log('📡 Received SIGTERM, shutting down gracefully...');
  await logToSupabase('stopped', 'Worker stopped via SIGTERM');
  process.exit(0);
});

// 🔄 SIGINT handler for graceful shutdown  
process.on('SIGINT', async () => {
  console.log('📡 Received SIGINT, shutting down gracefully...');
  await logToSupabase('stopped', 'Worker stopped via SIGINT');
  process.exit(0);
});

/**
 * Log to Supabase worker_registry table
 */
async function logToSupabase(status, message) {
  if (!currentServiceSchema) return;
  
  try {
    await supabase
      .from('worker_registry')
      .update({
        deployment_status: status,
        logs: message,
        last_health_check: new Date().toISOString()
      })
      .eq('service_schema', currentServiceSchema);
  } catch (error) {
    console.error('⚠️ Failed to log to Supabase:', error.message);
  }
}

async function main() {
  console.log('🚀 OSP Worker Launcher Starting...');
  console.log('🕒 Timestamp:', new Date().toISOString());
  
  // Validate MANIFEST_PATH
  const manifestPath = process.env.MANIFEST_PATH;
  if (!manifestPath) {
    console.error('❌ MANIFEST_PATH not set. Exiting...');
    process.exit(1);
  }
  
  console.log('📋 Manifest path:', manifestPath);
  
  try {
    // 📄 Load and parse manifest
    console.log('📄 Loading manifest file...');
    const raw = await fs.readFile(manifestPath, 'utf-8');
    const manifest = JSON.parse(raw);
    
    currentServiceSchema = manifest.service_schema;
    console.log('🔁 Service schema:', currentServiceSchema);
    console.log('📌 Task queue:', manifest.workflows[0]?.task_queue || `${currentServiceSchema}-tasks`);
    
    // Log startup to Supabase
    await logToSupabase('starting', `Worker starting for service: ${currentServiceSchema}`);
    
    // 🌐 Connect to Temporal and start worker
    console.log('🌐 Connecting to Temporal...');
    await createWorkerFromManifest(manifest);
    
    // This line should never be reached since createWorkerFromManifest runs indefinitely
    console.log('✅ Worker created for manifest:', manifestPath);
    
  } catch (err) {
    console.error('❌ Failed to start worker:');
    console.error('   Error:', err.message);
    console.error('   Stack:', err.stack);
    
    await logToSupabase('failed', `Worker startup failed: ${err.message}\nStack: ${err.stack}`);
    process.exit(1);
  }
}

main(); 