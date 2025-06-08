#!/usr/bin/env node

import { createWorkerFromManifest } from './generator/createWorkerFromManifest.js';

console.log('🚀 OSP Worker Starting (Simple Version)...');
console.log('📁 Working directory:', process.cwd());

async function main() {
  try {
    // Check environment
    const manifestId = process.env.MANIFEST_ID;
    console.log('🧪 MANIFEST_ID:', manifestId);
    
    if (!manifestId) {
      console.error('❌ MANIFEST_ID not set');
      // Keep running to prevent crash loops
      setInterval(() => {
        console.log('⏳ Waiting for MANIFEST_ID to be set...');
      }, 30000);
      return;
    }

    console.log('📋 MANIFEST_ID:', manifestId);
    console.log('🔄 Starting worker with manifest from Supabase...');
    
    // The createWorkerFromManifest will fetch from Supabase using the ID
    await createWorkerFromManifest(manifestId);
    
  } catch (error) {
    console.error('❌ Worker error:', error.message);
    console.error('Stack:', error.stack);
    
    // Keep running to prevent crash loops
    setInterval(() => {
      console.log('⏳ Worker failed but keeping process alive...');
    }, 30000);
  }
}

main(); 