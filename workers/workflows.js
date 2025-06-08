/**
 * 🔄 Temporal Workflows for OSP Workers
 */

import { proxyActivities } from '@temporalio/workflow';

// Create activity proxies
const { createEntity } = proxyActivities({
  startToCloseTimeout: '1 minute',
});

// Workflow: Create Reservation
export async function createReservationWorkflow(input) {
  console.log('🚀 Starting Create Reservation Workflow');
  console.log('📋 Input received:', input);
  
  try {
    // Execute the create entity activity
    const result = await createEntity(input);
    
    console.log('✅ Workflow completed successfully');
    return {
      workflowId: 'create_reservation_workflow',
      state: 'completed',
      result: result,
      completedAt: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ Workflow failed:', error);
    throw error;
  }
} 