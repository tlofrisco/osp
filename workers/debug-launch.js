#!/usr/bin/env node

console.log('🚀 DEBUG: Worker starting...');
console.log('📁 Current directory:', process.cwd());
console.log('📋 Environment variables:');
console.log('  MANIFEST_PATH:', process.env.MANIFEST_PATH);
console.log('  TEMPORAL_CLOUD_ENDPOINT:', process.env.TEMPORAL_CLOUD_ENDPOINT);
console.log('  TEMPORAL_API_KEY:', process.env.TEMPORAL_API_KEY ? 'SET' : 'NOT SET');
console.log('  PUBLIC_SUPABASE_URL:', process.env.PUBLIC_SUPABASE_URL);

// Check if manifest exists
const fs = require('fs');
const path = require('path');

console.log('\n📂 Checking directories:');
console.log('  Workers dir contents:', fs.readdirSync('.'));

if (fs.existsSync('manifests')) {
  console.log('  Manifests dir contents:', fs.readdirSync('manifests'));
} else {
  console.log('  ❌ Manifests directory not found!');
}

if (fs.existsSync('../manifests')) {
  console.log('  Parent manifests dir contents:', fs.readdirSync('../manifests'));
}

// Try to load the manifest
if (process.env.MANIFEST_PATH) {
  const manifestPath = process.env.MANIFEST_PATH;
  console.log(`\n📄 Trying to load manifest: ${manifestPath}`);
  
  if (fs.existsSync(manifestPath)) {
    console.log('  ✅ Manifest file exists!');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    console.log('  Service schema:', manifest.service_schema);
  } else {
    console.log('  ❌ Manifest file not found at:', manifestPath);
    console.log('  Absolute path would be:', path.resolve(manifestPath));
  }
}

console.log('\n✅ Debug complete. Exiting...');
process.exit(0); 