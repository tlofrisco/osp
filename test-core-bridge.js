#!/usr/bin/env node

/**
 * Minimal Core Bridge Test
 * Tests ONLY the @temporalio/core-bridge module loading
 */

console.log('🧪 Testing Temporal Core Bridge module loading...');
console.log(`📋 Node.js version: ${process.version}`);
console.log(`📋 Platform: ${process.platform} ${process.arch}`);
console.log(`📋 Environment: ${process.env.NODE_ENV || 'development'}`);

try {
  console.log('1️⃣ Attempting to import @temporalio/core-bridge...');
  
  // Test the problematic native module directly
  const coreBridge = await import('@temporalio/core-bridge');
  console.log('✅ Core Bridge imported successfully');
  console.log('📦 Exported methods:', Object.keys(coreBridge));
  
  console.log('2️⃣ Testing Worker import...');
  const { Worker } = await import('@temporalio/worker');
  console.log('✅ Worker class imported successfully');
  
  console.log('3️⃣ Testing basic Worker.create (without connection)...');
  // This should fail gracefully with connection error, not native module error
  try {
    await Worker.create({
      taskQueue: 'test-queue',
      workflowsPath: './workflows.js',
    });
  } catch (error) {
    if (error.message.includes('downcast')) {
      console.error('❌ CORE BRIDGE NATIVE MODULE ERROR:', error.message);
      process.exit(1);
    } else {
      console.log('✅ Worker.create failed as expected (connection/config issue, not native module)');
      console.log(`📋 Expected error: ${error.message.substring(0, 100)}...`);
    }
  }
  
  console.log('🎉 ALL TESTS PASSED - Native module loading works!');
  console.log('💡 The issue is likely in worker configuration, not the native module itself');
  
} catch (error) {
  console.error('❌ CORE BRIDGE TEST FAILED:', error);
  console.error('📋 Stack trace:', error.stack);
  
  if (error.message.includes('downcast')) {
    console.error('🔍 This confirms the native module downcasting issue');
    console.error('💡 Try: Different base image (Debian vs Alpine) or Node.js version');
  } else if (error.code === 'MODULE_NOT_FOUND') {
    console.error('🔍 Module not found - check installation');
  } else {
    console.error('🔍 Unknown error type - investigate further');
  }
  
  process.exit(1);
} 