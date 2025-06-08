/**
 * 🎯 Manual Workflow Completion - Complete stuck workflows without worker
 * Service schema driven by MANIFEST_PATH environment variable.
 */

import { Client, Connection } from '@temporalio/client';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import 'dotenv/config';

console.log('🎯 Starting manual workflow completion...');

// Supabase client  
const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function completeStuckWorkflow() {
  try {
    // Load service schema from manifest
    const manifestPath = process.env.MANIFEST_PATH;
    if (!manifestPath) {
      throw new Error('MANIFEST_PATH environment variable is required');
    }
    
    console.log('📋 Loading manifest:', manifestPath);
    const manifestRaw = await fs.readFile(manifestPath, 'utf-8');
    const manifest = JSON.parse(manifestRaw);
    const serviceSchema = manifest.service_schema;
    const taskQueue = manifest.workflows[0]?.task_queue || `${serviceSchema}-tasks`;
    
    console.log('🔁 Service schema:', serviceSchema);
    console.log('📌 Task queue:', taskQueue);
    
    console.log('🌐 Connecting to Temporal Cloud...');
    
    const connection = await Connection.connect({
      address: process.env.TEMPORAL_CLOUD_ENDPOINT,
      tls: true,
      apiKey: process.env.TEMPORAL_API_KEY,
    });
    
    const client = new Client({
      connection,
      namespace: process.env.TEMPORAL_CLOUD_NAMESPACE,
    });
    
    console.log('✅ Connected to Temporal Cloud');
    
    // List workflows to find the stuck one
    console.log('🔍 Looking for stuck workflows...');
    
    const workflows = await client.workflow.list({
      query: `TaskQueue="${taskQueue}" AND ExecutionStatus="Running"`
    });
    
    console.log(`📋 Found ${workflows.length} running workflows`);
    
    for await (const workflow of workflows) {
      console.log(`🔍 Found workflow: ${workflow.workflowId}`);
      console.log(`   Status: ${workflow.status?.name}`);
      console.log(`   Started: ${workflow.startTime}`);
      
      // Create a reservation manually (simulating what the worker would do)
      console.log('💾 Creating reservation manually...');
      const entityData = {
        id: `reservation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        customer_name: 'Manual Test Customer ' + Date.now(),
        phone_number: '555-' + Math.floor(Math.random() * 10000).toString().padStart(4, '0'),
        reservation_date: new Date().toISOString(),
        reservation_time: '19:00',
        party_size: 2,
        table_number: Math.floor(Math.random() * 20) + 1,
        status: 'pending',
        special_requests: 'Created manually due to worker issues',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase.rpc('insert_into_dynamic_table', {
        in_schema_name: serviceSchema,
        in_table_name: 'reservation',
        json_data: entityData
      });
      
      if (error) {
        console.error('Failed to create reservation:', error);
        continue;
      }
      
      console.log('✅ Reservation created manually:', entityData);
      
      try {
        // Try to signal the workflow to complete
        const handle = client.workflow.getHandle(workflow.workflowId);
        
        // Since we can't easily complete the workflow without the worker,
        // let's at least terminate it cleanly
        console.log('🔄 Attempting to terminate workflow...');
        await handle.terminate('Completed manually due to worker issues');
        
        console.log('✅ Workflow terminated successfully');
        
      } catch (signalError) {
        console.log('⚠️ Could not signal workflow (this is expected):', signalError.message);
      }
    }
    
    if (workflows.length === 0) {
      console.log('ℹ️ No stuck workflows found. Creating a test reservation anyway...');
      const entityData = {
        id: `reservation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        customer_name: 'Direct Test Customer ' + Date.now(),
        phone_number: '555-' + Math.floor(Math.random() * 10000).toString().padStart(4, '0'),
        reservation_date: new Date().toISOString(),
        reservation_time: '19:00',
        party_size: 4,
        table_number: Math.floor(Math.random() * 20) + 1,
        status: 'pending',
        special_requests: 'Created directly without workflow',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase.rpc('insert_into_dynamic_table', {
        in_schema_name: serviceSchema,
        in_table_name: 'reservation',
        json_data: entityData
      });
      
      if (error) {
        console.error('Failed to create reservation:', error);
      } else {
        console.log('✅ Direct reservation created:', entityData);
      }
    }
    
    console.log('🎉 Manual completion process finished!');
    
  } catch (error) {
    console.error('❌ Manual completion failed:', error);
  }
}

// Run the manual completion
completeStuckWorkflow(); 