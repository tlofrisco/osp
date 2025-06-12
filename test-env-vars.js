#!/usr/bin/env node

/**
 * Test environment variables loading
 */

import dotenv from 'dotenv';

// Load environment variables from the root .env file
dotenv.config();

console.log('🔍 Environment Variables Check\n');

const requiredVars = [
  'RAILWAY_API_TOKEN',
  'RAILWAY_PROJECT_ID', 
  'RAILWAY_ENVIRONMENT_ID',
  'GITHUB_REPO',
  'GITHUB_BRANCH'
];

console.log('Required Railway Environment Variables:');
requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    // Show only first/last few characters for security
    const maskedValue = value.length > 20 
      ? `${value.substring(0, 6)}...${value.substring(value.length - 4)}`
      : `${value.substring(0, 3)}...`;
    console.log(`✅ ${varName}: ${maskedValue}`);
  } else {
    console.log(`❌ ${varName}: NOT SET`);
  }
});

console.log('\nAll environment variables:');
Object.keys(process.env)
  .filter(key => key.includes('RAILWAY') || key.includes('GITHUB'))
  .forEach(key => {
    const value = process.env[key];
    const maskedValue = value && value.length > 20 
      ? `${value.substring(0, 6)}...${value.substring(value.length - 4)}`
      : value;
    console.log(`${key}: ${maskedValue}`);
  }); 