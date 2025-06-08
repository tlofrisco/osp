/**
 * 🔧 OSP Service Activities
 * 
 * Shared activities used across multiple service workflows.
 * These are pooled and reused for efficiency.
 * Service type determined dynamically from manifest.
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// Create Supabase client
const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Activity: Insert Reservation
export async function insertReservation(input) {
  console.log('🔄 insertReservation - Creating reservation with input:', input);
  
  const serviceSchema = input.serviceSchema;
  if (!serviceSchema) {
    throw new Error('serviceSchema is required - must be provided by manifest');
  }
  
  // Generate reservation data
  const reservationData = {
    id: `reservation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    customer_name: input.customer_name || `Customer ${Date.now()}`,
    phone_number: input.phone_number || '555-' + Math.floor(Math.random() * 10000).toString().padStart(4, '0'),
    reservation_date: input.reservation_date || new Date().toISOString(),
    reservation_time: input.reservation_time || '19:00',
    party_size: input.party_size || 2,
    table_number: input.table_number || Math.floor(Math.random() * 20) + 1,
    status: 'confirmed',
    special_requests: input.special_requests || 'Created via Temporal workflow',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  console.log(`💾 Creating reservation in schema ${serviceSchema}:`, reservationData);
  
  // Use RPC to insert
  const { data, error } = await supabase.rpc('insert_into_dynamic_table', {
    in_schema_name: serviceSchema,
    in_table_name: 'reservation',
    json_data: reservationData
  });
  
  if (error) {
    console.error('Failed to create reservation:', error);
    throw new Error(`Failed to create reservation: ${error.message}`);
  }
  
  console.log('✅ Reservation created successfully:', data);
  return { success: true, reservationId: reservationData.id, data: reservationData };
}

// Activity: Update Reservation Status
export async function updateReservationStatus(input) {
  console.log('🔄 updateReservationStatus - Updating reservation:', input);
  
  const serviceSchema = input.serviceSchema;
  if (!serviceSchema) {
    throw new Error('serviceSchema is required - must be provided by manifest');
  }
  const { reservationId, status, reason } = input;
  
  if (!reservationId || !status) {
    throw new Error('reservationId and status are required for updateReservationStatus');
  }
  
  const updateData = {
    status: status,
    updated_at: new Date().toISOString(),
    ...(reason && { cancellation_reason: reason })
  };
  
  console.log(`🔄 Updating reservation ${reservationId} to status: ${status}`);
  
  // Use RPC to update
  const updateSql = `
    UPDATE "${serviceSchema}"."reservation" 
    SET status = $1, updated_at = $2${reason ? ', cancellation_reason = $3' : ''}
    WHERE id = $${reason ? '4' : '3'}
    RETURNING *;
  `;
  
  const { data, error } = await supabase.rpc('execute_sql', {
    sql_text: updateSql
  });
  
  if (error) {
    console.error('Failed to update reservation:', error);
    throw new Error(`Failed to update reservation: ${error.message}`);
  }
  
  console.log('✅ Reservation status updated successfully');
  return { success: true, reservationId, newStatus: status };
}

// Activity: Send Notification
export async function sendNotification(input) {
  console.log('🔄 sendNotification - Sending notification:', input);
  
  const { type, recipient, message, reservationId } = input;
  
  // In a real implementation, this would integrate with SMS/email services
  // For now, we'll simulate and log
  const notification = {
    id: `notification_${Date.now()}`,
    type: type || 'sms',
    recipient: recipient,
    message: message,
    reservationId: reservationId,
    sent_at: new Date().toISOString(),
    status: 'sent'
  };
  
  console.log('📧 Notification sent:', notification);
  
  // Simulate notification delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  return { success: true, notificationId: notification.id, notification };
}

// Activity: Charge Customer
export async function chargeCustomer(input) {
  console.log('🔄 chargeCustomer - Processing payment:', input);
  
  const { amount, customerId, reservationId, paymentMethod } = input;
  
  if (!amount || amount <= 0) {
    throw new Error('Valid amount is required for payment processing');
  }
  
  // Simulate payment processing
  const payment = {
    id: `payment_${Date.now()}`,
    amount: amount,
    customerId: customerId,
    reservationId: reservationId,
    paymentMethod: paymentMethod || 'card',
    status: 'completed',
    processed_at: new Date().toISOString()
  };
  
  console.log('💳 Payment processed:', payment);
  
  // Simulate payment processing delay
  await new Promise(resolve => setTimeout(resolve, 200));
  
  return { success: true, paymentId: payment.id, payment };
}

// Activity: Log Transaction
export async function logTransaction(input) {
  console.log('🔄 logTransaction - Logging transaction:', input);
  
  const { paymentId, reservationId, amount, type } = input;
  
  const transaction = {
    id: `transaction_${Date.now()}`,
    paymentId: paymentId,
    reservationId: reservationId,
    amount: amount,
    type: type || 'payment',
    logged_at: new Date().toISOString()
  };
  
  console.log('📊 Transaction logged:', transaction);
  
  return { success: true, transactionId: transaction.id, transaction };
}

// Export all activities as default
export default {
  insertReservation,
  updateReservationStatus,
  sendNotification,
  chargeCustomer,
  logTransaction
}; 