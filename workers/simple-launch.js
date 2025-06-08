#!/usr/bin/env node

import { createWorkerFromManifest } from './generator/createWorkerFromManifest.js';
import fs from 'fs/promises';
import path from 'path';

console.log('🚀 OSP Worker Starting (Simple Version)...');
console.log('📁 Working directory:', process.cwd());

async function main() {
  try {
    // Debug: List files in current directory
    try {
      const files = await fs.readdir('.');
      console.log('📂 Files in current directory:', files);
      
      if (files.includes('manifests')) {
        const manifestFiles = await fs.readdir('./manifests');
        console.log('📁 Current files in manifests:', manifestFiles);
      }
    } catch (e) {
      console.log('⚠️ Could not list directory contents:', e.message);
    }
    
    // Check environment
    const manifestPath = process.env.MANIFEST_PATH;
    console.log('🧪 MANIFEST_PATH:', manifestPath);
    
    if (!manifestPath) {
      console.error('❌ MANIFEST_PATH not set');
      // Keep running to prevent crash loops
      setInterval(() => {
        console.log('⏳ Waiting for MANIFEST_PATH to be set...');
      }, 30000);
      return;
    }

    console.log('📋 MANIFEST_PATH:', manifestPath);
    
    // Try multiple possible locations
    const possiblePaths = [
      manifestPath,
      path.join('manifests', path.basename(manifestPath)),
      path.join('./manifests', path.basename(manifestPath)),
      path.join('../manifests', path.basename(manifestPath)),
      path.join('workers/manifests', path.basename(manifestPath))
    ];

    let manifest = null;
    let foundPath = null;
    
    for (const tryPath of possiblePaths) {
      try {
        console.log(`🔍 Checking: ${tryPath}`);
        const data = await fs.readFile(tryPath, 'utf-8');
        manifest = JSON.parse(data);
        foundPath = tryPath;
        console.log(`✅ Found manifest at: ${tryPath}`);
        break;
      } catch (e) {
        console.log(`❌ Not found at: ${tryPath}`);
      }
    }

    if (!manifest) {
      console.error('❌ Could not find manifest file anywhere');
      // Keep running to prevent crash loops
      setInterval(() => {
        console.log('⏳ Waiting for manifest file...');
      }, 30000);
      return;
    }

    console.log('🔄 Starting worker for:', manifest.service_schema);
    await createWorkerFromManifest(manifest);
    
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