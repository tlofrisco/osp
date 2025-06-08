/**
 * 🧪 Test Complete Enhanced Worker Logging - Success Flow
 * 
 * Tests with the actual restaurant manifest to show complete success logging
 */

import { createWorkerFromManifest } from './generator/createWorkerFromManifest.js';
import fs from 'fs/promises';

console.log('🧪 Testing Complete Enhanced Worker Logging - Success Flow...\n');

try {
  // Load the actual restaurant manifest
  const manifestPath = './manifests/a_restaurant_reservation_syste_1749301938153.json';
  const manifestRaw = await fs.readFile(manifestPath, 'utf-8');
  const manifest = JSON.parse(manifestRaw);
  
  console.log('📋 Using Actual Restaurant Manifest:');
  console.log('   Service Schema:', manifest.service_schema);
  console.log('   Task Queue:', manifest.workflows[0].task_queue);
  console.log('');
  
  console.log('🔍 Expected SUCCESS Log Messages:');
  console.log('   ✅ 🌐 Connecting to Temporal...');
  console.log('   ✅ 📡 Listening on task queue: ${taskQueue}');
  console.log('   ✅ 👂 Worker successfully started');
  console.log('   ✅ Supabase worker_registry updates');
  console.log('');
  
  console.log('⏳ Starting worker with actual manifest...');
  console.log('   (This should connect successfully and run indefinitely)');
  console.log('   (Use Ctrl+C to test graceful shutdown)');
  console.log('');
  
  await createWorkerFromManifest(manifest);
  
} catch (error) {
  console.error('\n🔥 Worker error (with full stack trace):');
  console.error('   Error:', error.message);
  console.error('   Stack:', error.stack);
} 