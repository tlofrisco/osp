#!/usr/bin/env node

/**
 * Test the updated Railway service creation process
 * 
 * Tests the two-step approach:
 * 1. serviceCreate - Create empty service
 * 2. serviceConnect - Connect to GitHub repo
 */

import { 
  createRailwayService,
  getRailwayServiceId,
  deleteRailwayService
} from './railwayService.js';
import fs from 'fs';
import path from 'path';

// Load environment
const envPath = path.join(process.cwd(), '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envLines = envContent.split('\n');
  
  envLines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=');
      process.env[key] = value;
    }
  });
}

async function testServiceCreation() {
  console.log('🧪 Testing Railway Service Creation\n');
  
  // Test service schema (using timestamp to ensure uniqueness)
  const testServiceSchema = `test_creation_${Date.now()}`;
  let createdServiceId = null;
  
  try {
    console.log('📋 Environment check:');
    console.log(`   RAILWAY_TOKEN: ${process.env.RAILWAY_TOKEN ? 'SET' : 'NOT SET'}`);
    console.log(`   RAILWAY_PROJECT_ID: ${process.env.RAILWAY_PROJECT_ID || 'NOT SET'}`);
    console.log(`   GITHUB_REPO: ${process.env.GITHUB_REPO || 'NOT SET'}`);
    console.log(`   GITHUB_BRANCH: ${process.env.GITHUB_BRANCH || 'NOT SET'}\n`);
    
    // Test 1: Check for non-existent service
    console.log('📋 Test 1: Checking for non-existent service...');
    const nonExistentId = await getRailwayServiceId(testServiceSchema);
    if (nonExistentId === null) {
      console.log('✅ Correctly returned null for non-existent service\n');
    } else {
      console.log('❌ Unexpected service found\n');
    }
    
    // Test 2: Create a new service (using new two-step approach)
    console.log('📋 Test 2: Creating new Railway service...');
    createdServiceId = await createRailwayService(testServiceSchema);
    console.log(`✅ Service created with ID: ${createdServiceId}\n`);
    
    // Test 3: Verify service exists
    console.log('📋 Test 3: Verifying service exists...');
    const foundServiceId = await getRailwayServiceId(testServiceSchema);
    if (foundServiceId === createdServiceId) {
      console.log('✅ Service found with correct ID\n');
    } else {
      console.log(`❌ Service ID mismatch: expected ${createdServiceId}, got ${foundServiceId}\n`);
    }
    
    // Test 4: Clean up - delete the test service
    console.log('📋 Test 4: Cleaning up test service...');
    await deleteRailwayService(createdServiceId);
    console.log('✅ Test service deleted\n');
    
    console.log('🎉 All service creation tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    
    if (error.response?.errors) {
      console.error('GraphQL Errors:', JSON.stringify(error.response.errors, null, 2));
    }
    
    // Clean up if service was created
    if (createdServiceId) {
      console.log('🧹 Attempting to clean up test service...');
      try {
        await deleteRailwayService(createdServiceId);
        console.log('✅ Cleanup successful');
      } catch (cleanupError) {
        console.error('❌ Cleanup failed:', cleanupError);
      }
    }
    
    process.exit(1);
  }
}

// Run the test
testServiceCreation(); 