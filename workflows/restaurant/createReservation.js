/**
 * 🍽️ Create Reservation Workflow
 * 
 * Handles the complete reservation creation process including
 * data insertion and customer notification.
 */

import { proxyActivities } from '@temporalio/workflow';

// Create activity proxies with timeouts
const { insertReservation, sendNotification } = proxyActivities({
  startToCloseTimeout: '2 minutes',
  retry: {
    initialInterval: '1s',
    maximumInterval: '10s',
    backoffCoefficient: 2,
    maximumAttempts: 3,
  },
});

export async function createReservation(input) {
  console.log('🚀 Starting createReservation workflow');
  console.log('📋 Input received:', input);
  
  try {
    // Step 1: Insert the reservation into the database
    console.log('📍 Step 1: Creating reservation record');
    const reservationResult = await insertReservation({
      ...input,
      serviceSchema: input.serviceSchema || 'a_restaurant_reservation_syste_1749301938153'
    });
    
    console.log('✅ Reservation created:', reservationResult.reservationId);
    
    // Step 2: Send confirmation notification to customer
    console.log('📍 Step 2: Sending confirmation notification');
    const notificationResult = await sendNotification({
      type: 'sms',
      recipient: input.phone_number || reservationResult.data.phone_number,
      message: `Reservation confirmed for ${reservationResult.data.customer_name} on ${reservationResult.data.reservation_date} at ${reservationResult.data.reservation_time}. Table ${reservationResult.data.table_number}. Party of ${reservationResult.data.party_size}.`,
      reservationId: reservationResult.reservationId
    });
    
    console.log('✅ Notification sent:', notificationResult.notificationId);
    
    // Workflow completed successfully
    const result = {
      workflowId: 'createReservation',
      status: 'completed',
      reservationId: reservationResult.reservationId,
      reservation: reservationResult.data,
      notification: notificationResult.notification,
      completedAt: new Date().toISOString()
    };
    
    console.log('🎉 createReservation workflow completed successfully');
    return result;
    
  } catch (error) {
    console.error('❌ createReservation workflow failed:', error);
    throw error;
  }
}

// Export as default for dynamic loading
export default createReservation; 