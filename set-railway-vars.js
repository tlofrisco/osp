#!/usr/bin/env node

/**
 * Set Railway Environment Variables from Local Environment
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import dotenv from 'dotenv';

const execAsync = promisify(exec);

// Load environment variables
dotenv.config();

async function setRailwayVariables() {
  console.log('🔧 Setting Railway environment variables...');
  
  const variables = {
    'TEMPORAL_API_KEY': process.env.TEMPORAL_API_KEY,
    'PUBLIC_SUPABASE_URL': process.env.PUBLIC_SUPABASE_URL, 
    'SUPABASE_SERVICE_ROLE_KEY': process.env.SUPABASE_SERVICE_ROLE_KEY
  };
  
  for (const [key, value] of Object.entries(variables)) {
    if (value) {
      try {
        console.log(`📝 Setting ${key}...`);
        await execAsync(`railway variables --set "${key}=${value}"`);
        console.log(`✅ ${key} set successfully`);
      } catch (error) {
        console.error(`❌ Failed to set ${key}:`, error.message);
      }
    } else {
      console.warn(`⚠️ ${key} not found in local environment`);
    }
  }
  
  console.log('🎉 Railway variables configuration complete!');
}

setRailwayVariables().catch(console.error); 