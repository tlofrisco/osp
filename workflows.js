import { proxyActivities } from '@temporalio/workflow';

// Simple activity proxy
const { createEntity } = proxyActivities({
  startToCloseTimeout: '30s',
  retryPolicy: {
    maximumAttempts: 3,
  },
});

// Clean workflow implementation
export async function createServiceWorkflow(serviceData) {
  console.log(`🔄 Starting workflow for service: ${serviceData.name}`);
  
  try {
    const result = await createEntity(serviceData);
    console.log(`✅ Service created successfully: ${result.id}`);
    return result;
  } catch (error) {
    console.error(`❌ Workflow failed: ${error.message}`);
    throw error;
  }
} 