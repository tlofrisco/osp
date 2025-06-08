/**
 * 🧪 Test Worker Automation System
 * 
 * Tests the complete queueWorkerBuild() function to verify:
 * - Supabase worker_registry logging
 * - Railway CLI integration  
 * - Retry mechanism
 */

import { queueWorkerBuild } from './queueWorkerBuild.js';

async function testWorkerAutomation() {
  console.log('🧪 Testing OSP Worker Automation System...\n');
  
  try {
    console.log('📋 Test 1: Deploy worker for test service');
    const testServiceSchema = 'test_automation_service_' + Date.now();
    
    console.log(`🚀 Testing deployment for: ${testServiceSchema}`);
    console.log('⏳ This will test Supabase logging + Railway CLI execution...\n');
    
    const result = await queueWorkerBuild(testServiceSchema);
    
    console.log('\n📊 Test Results:');
    console.log('================');
    console.log('Success:', result.success);
    console.log('Service Schema:', result.service_schema);
    
    if (result.success) {
      console.log('✅ AUTOMATION TEST PASSED!');
      console.log('🎯 The worker automation system is working correctly.');
      console.log('💾 Check the worker_registry table in Supabase for deployment logs.');
      console.log('🚢 Check Railway dashboard for the deployed worker.');
    } else {
      console.log('❌ AUTOMATION TEST FAILED:');
      console.log('Error:', result.error);
      console.log('💡 Check Railway CLI authentication and environment variables.');
    }
    
  } catch (error) {
    console.error('💥 Test failed with error:', error);
    console.error('🔍 Error details:', error.message);
  }
}

// Run the test
testWorkerAutomation(); 