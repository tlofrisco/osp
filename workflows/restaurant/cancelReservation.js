/**
 * 🍽️ Cancel Reservation Workflow
 * 
 * Handles reservation cancellation including status update
 * and customer notification.
 */

import { proxyActivities } from '@temporalio/workflow';

// Create activity proxies with timeouts
const { updateReservationStatus, sendNotification } = proxyActivities({
  startToCloseTimeout: '2 minutes',
  retry: {
    initialInterval: '1s',
    maximumInterval: '10s',
    backoffCoefficient: 2,
    maximumAttempts: 3,
  },
});

export async function cancelReservation(input) {
  console.log('🚀 Starting cancelReservation workflow');
  console.log('📋 Input received:', input);
  
  try {
    const { reservationId, reason, customerPhone, customerName } = input;
    
    if (!reservationId) {
      throw new Error('reservationId is required for cancellation');
    }
    
    // Step 1: Update reservation status to cancelled
    console.log('📍 Step 1: Updating reservation status to cancelled');
    const updateResult = await updateReservationStatus({
      serviceSchema: input.serviceSchema || 'a_restaurant_reservation_syste_1749301938153',
      reservationId: reservationId,
      status: 'cancelled',
      reason: reason || 'Customer requested cancellation'
    });
    
    console.log('✅ Reservation status updated:', updateResult.reservationId);
    
    // Step 2: Send cancellation notification to customer
    console.log('📍 Step 2: Sending cancellation notification');
    const notificationResult = await sendNotification({
      type: 'sms',
      recipient: customerPhone,
      message: `Your reservation ${reservationId} has been cancelled. ${reason ? 'Reason: ' + reason : ''} If you need to rebook, please contact us.`,
      reservationId: reservationId
    });
    
    console.log('✅ Cancellation notification sent:', notificationResult.notificationId);
    
    // Workflow completed successfully
    const result = {
      workflowId: 'cancelReservation',
      status: 'completed',
      reservationId: reservationId,
      cancellationReason: reason,
      notification: notificationResult.notification,
      completedAt: new Date().toISOString()
    };
    
    console.log('🎉 cancelReservation workflow completed successfully');
    return result;
    
  } catch (error) {
    console.error('❌ cancelReservation workflow failed:', error);
    throw error;
  }
}

// Export as default for dynamic loading
export default cancelReservation; 