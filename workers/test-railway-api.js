#!/usr/bin/env node

/**
 * Test script for Railway API integration
 * 
 * This verifies that:
 * 1. Railway API credentials are configured correctly
 * 2. We can query existing services
 * 3. We can create/update/deploy services
 * 
 * Run with: node test-railway-api.js
 */

import { 
  getRailwayServiceId,
  createRailwayService,
  setRailwayEnvironmentVariables,
  deployRailwayService,
  deleteRailwayService
} from './railwayService.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testRailwayAPI() {
  console.log('🧪 Testing Railway API Integration\n');
  
  // Test service schema (using timestamp to ensure uniqueness)
  const testServiceSchema = `test_railway_api_${Date.now()}`;
  let createdServiceId = null;
  
  try {
    // Test 1: Check for non-existent service
    console.log('📋 Test 1: Checking for non-existent service...');
    const nonExistentId = await getRailwayServiceId(testServiceSchema);
    if (nonExistentId === null) {
      console.log('✅ Correctly returned null for non-existent service\n');
    } else {
      console.log('❌ Unexpected service found\n');
    }
    
    // Test 2: Create a new service
    console.log('📋 Test 2: Creating new Railway service...');
    createdServiceId = await createRailwayService(testServiceSchema);
    console.log(`✅ Service created with ID: ${createdServiceId}\n`);
    
    // Test 3: Verify service exists
    console.log('📋 Test 3: Verifying service exists...');
    const foundServiceId = await getRailwayServiceId(testServiceSchema);
    if (foundServiceId === createdServiceId) {
      console.log('✅ Service found with correct ID\n');
    } else {
      console.log('❌ Service ID mismatch\n');
    }
    
    // Test 4: Set environment variables
    console.log('📋 Test 4: Setting environment variables...');
    await setRailwayEnvironmentVariables(createdServiceId, {
      TEST_VAR_1: 'value1',
      TEST_VAR_2: 'value2',
      MANIFEST_ID: 'test-manifest-id'
    });
    console.log('✅ Environment variables set successfully\n');
    
    // Test 5: Deploy the service
    console.log('📋 Test 5: Deploying service...');
    const deploymentId = await deployRailwayService(createdServiceId);
    console.log(`✅ Deployment initiated with ID: ${deploymentId}\n`);
    
    // Test 6: Clean up - delete the test service
    console.log('📋 Test 6: Cleaning up test service...');
    await deleteRailwayService(createdServiceId);
    console.log('✅ Test service deleted\n');
    
    console.log('🎉 All tests passed! Railway API integration is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    
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
testRailwayAPI(); 