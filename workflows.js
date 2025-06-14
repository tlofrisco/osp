import { proxyActivities } from '@temporalio/workflow';

// Activity proxy matching the worker's activity definition
const { createEntityInService } = proxyActivities({
  startToCloseTimeout: '30s',
  retryPolicy: {
    maximumAttempts: 3,
  },
});

// Updated workflow implementation to match the activity signature
export async function createServiceWorkflow(serviceSchema, entityName, data) {
  console.log(`🔄 Starting workflow for ${serviceSchema}.${entityName}`);
  
  try {
    const result = await createEntityInService(serviceSchema, entityName, data);
    console.log(`✅ Entity created successfully in ${serviceSchema}.${entityName}:`, result);
    return result;
  } catch (error) {
    console.error(`❌ Workflow failed for ${serviceSchema}.${entityName}: ${error.message}`);
    throw error;
  }
} 