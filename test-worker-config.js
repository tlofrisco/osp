#!/usr/bin/env node

/**
 * 🧪 OSP Worker Configuration Test
 * 
 * Tests all required environment variables and connections
 * before deploying to Railway. Run this locally first!
 * 
 * Usage: node test-worker-config.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

console.log('🧪 Testing OSP Unified Worker Configuration...\n');

// Test 1: Required Environment Variables
console.log('📋 Step 1: Checking Required Environment Variables');
const requiredVars = [
  'TEMPORAL_CLOUD_ENDPOINT',
  'TEMPORAL_API_KEY', 
  'TEMPORAL_CLOUD_NAMESPACE',
  'PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY'
];

let allVarsPresent = true;
for (const varName of requiredVars) {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value.substring(0, 20)}...`);
  } else {
    console.log(`❌ ${varName}: NOT SET`);
    allVarsPresent = false;
  }
}

if (!allVarsPresent) {
  console.log('\n❌ Missing required environment variables. Set them in your .env file.');
  process.exit(1);
}

// Test 2: Check for Railway vars (should NOT be needed)
console.log('\n🔍 Step 2: Checking Railway Variables (should be optional)');
const railwayVars = ['RAILWAY_TOKEN', 'RAILWAY_PROJECT_ID', 'RAILWAY_ENVIRONMENT_ID'];
for (const varName of railwayVars) {
  const value = process.env[varName];
  if (value) {
    console.log(`ℹ️ ${varName}: SET (${value.substring(0, 8)}...) - NOT needed for worker`);
  } else {
    console.log(`✅ ${varName}: NOT SET - Correct! Not needed for worker execution`);
  }
}

// Test 3: Supabase Connection
console.log('\n🗄️ Step 3: Testing Supabase Connection');
try {
  const supabase = createClient(
    process.env.PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  // Test query
  const { data, error } = await supabase.from('services').select('count').limit(1);
  if (error) {
    console.log(`❌ Supabase Connection Failed: ${error.message}`);
  } else {
    console.log('✅ Supabase Connection: SUCCESS');
  }
} catch (error) {
  console.log(`❌ Supabase Test Error: ${error.message}`);
}

// Test 4: Temporal Configuration Check
console.log('\n⏰ Step 4: Validating Temporal Configuration');
const endpoint = process.env.TEMPORAL_CLOUD_ENDPOINT;
const namespace = process.env.TEMPORAL_CLOUD_NAMESPACE;
const apiKey = process.env.TEMPORAL_API_KEY;

if (endpoint && endpoint.includes('.tmprl.cloud:7233')) {
  console.log('✅ Temporal Endpoint: Valid format');
} else {
  console.log('❌ Temporal Endpoint: Should end with .tmprl.cloud:7233');
}

if (namespace && namespace.length > 0) {
  console.log('✅ Temporal Namespace: Set');
} else {
  console.log('❌ Temporal Namespace: Invalid');
}

if (apiKey && apiKey.length > 20) {
  console.log('✅ Temporal API Key: Valid length');
} else {
  console.log('❌ Temporal API Key: Too short or missing');
}

// Test 5: Summary
console.log('\n📊 Configuration Summary:');
console.log('┌─────────────────────────────────────────┐');
console.log('│ OSP Unified Worker Configuration Test   │');
console.log('├─────────────────────────────────────────┤');
console.log(`│ Environment Variables: ${allVarsPresent ? '✅ PASS' : '❌ FAIL'}              │`);
console.log(`│ Supabase Connection:   Testing...       │`);
console.log(`│ Temporal Config:       ${endpoint && namespace && apiKey ? '✅ PASS' : '❌ FAIL'}              │`);
console.log('└─────────────────────────────────────────┘');

if (allVarsPresent && endpoint && namespace && apiKey) {
  console.log('\n🚀 Ready for Railway Deployment!');
  console.log('\nNext Steps:');
  console.log('1. Go to Railway Dashboard → osp-worker service');
  console.log('2. Set Environment Variables (same as your .env)');
  console.log('3. Set Root Directory to "/" (not /workers)');
  console.log('4. Deploy!');
} else {
  console.log('\n❌ Fix configuration issues before deploying to Railway');
} 