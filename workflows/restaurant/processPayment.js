/**
 * 🍽️ Process Payment Workflow
 * 
 * Handles payment processing for restaurant reservations
 * including charging the customer and logging the transaction.
 */

import { proxyActivities } from '@temporalio/workflow';

// Create activity proxies with timeouts
const { chargeCustomer, logTransaction } = proxyActivities({
  startToCloseTimeout: '2 minutes',
  retry: {
    initialInterval: '1s',
    maximumInterval: '10s',
    backoffCoefficient: 2,
    maximumAttempts: 3,
  },
});

export async function processPayment(input) {
  console.log('🚀 Starting processPayment workflow');
  console.log('📋 Input received:', input);
  
  try {
    const { amount, customerId, reservationId, paymentMethod } = input;
    
    if (!amount || amount <= 0) {
      throw new Error('Valid amount is required for payment processing');
    }
    
    if (!reservationId) {
      throw new Error('reservationId is required for payment processing');
    }
    
    // Step 1: Charge the customer
    console.log('📍 Step 1: Processing customer payment');
    const paymentResult = await chargeCustomer({
      amount: amount,
      customerId: customerId,
      reservationId: reservationId,
      paymentMethod: paymentMethod || 'card'
    });
    
    console.log('✅ Payment processed:', paymentResult.paymentId);
    
    // Step 2: Log the transaction
    console.log('📍 Step 2: Logging transaction record');
    const transactionResult = await logTransaction({
      paymentId: paymentResult.paymentId,
      reservationId: reservationId,
      amount: amount,
      type: 'restaurant_payment'
    });
    
    console.log('✅ Transaction logged:', transactionResult.transactionId);
    
    // Workflow completed successfully
    const result = {
      workflowId: 'processPayment',
      status: 'completed',
      paymentId: paymentResult.paymentId,
      transactionId: transactionResult.transactionId,
      amount: amount,
      reservationId: reservationId,
      payment: paymentResult.payment,
      transaction: transactionResult.transaction,
      completedAt: new Date().toISOString()
    };
    
    console.log('🎉 processPayment workflow completed successfully');
    return result;
    
  } catch (error) {
    console.error('❌ processPayment workflow failed:', error);
    throw error;
  }
}

// Export as default for dynamic loading
export default processPayment; 