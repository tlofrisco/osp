#!/usr/bin/env node

/**
 * Direct Railway API test with explicit environment loading
 */

import { GraphQLClient, gql } from 'graphql-request';
import fs from 'fs';
import path from 'path';

// Manually load .env file
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envLines = envContent.split('\n');
  
  envLines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=');
      process.env[key] = value;
    }
  });
  
  console.log('✅ Loaded .env file manually');
} else {
  console.log('❌ .env file not found');
}

// Test Railway credentials
const RAILWAY_API_TOKEN = process.env.RAILWAY_API_TOKEN;
const RAILWAY_PROJECT_ID = process.env.RAILWAY_PROJECT_ID;
const RAILWAY_ENVIRONMENT_ID = process.env.RAILWAY_ENVIRONMENT_ID;

console.log('🔍 Railway Environment Variables:');
console.log(`RAILWAY_API_TOKEN: ${RAILWAY_API_TOKEN ? `${RAILWAY_API_TOKEN.substring(0, 8)}...` : 'NOT SET'}`);
console.log(`RAILWAY_PROJECT_ID: ${RAILWAY_PROJECT_ID || 'NOT SET'}`);
console.log(`RAILWAY_ENVIRONMENT_ID: ${RAILWAY_ENVIRONMENT_ID || 'NOT SET'}\n`);

if (!RAILWAY_API_TOKEN) {
  console.log('❌ RAILWAY_API_TOKEN is not set!');
  process.exit(1);
}

// Test the token
const client = new GraphQLClient('https://backboard.railway.app/graphql/v2', {
  headers: {
    authorization: `Bearer ${RAILWAY_API_TOKEN}`,
  },
});

async function testToken() {
  try {
    console.log('🧪 Testing Railway API token...');
    
    // Test 1: Basic me query
    const meQuery = gql`
      query Me {
        me {
          id
          name
          email
        }
      }
    `;
    
    const result = await client.request(meQuery);
    console.log('✅ Token is valid!');
    console.log(`   User: ${result.me.name} (${result.me.email})`);
    
    // Test 2: Simple project query (without environment)
    const projectQuery = gql`
      query GetProject($projectId: String!) {
        project(id: $projectId) {
          id
          name
          description
        }
      }
    `;
    
    const projectResult = await client.request(projectQuery, {
      projectId: RAILWAY_PROJECT_ID
    });
    console.log('✅ Project access successful!');
    console.log(`   Project: ${projectResult.project.name}`);
    
  } catch (error) {
    console.error('❌ Token test failed:', error.message);
    
    if (error.response) {
      console.error('Status:', error.response.status);
      if (error.response.errors) {
        console.error('Errors:', JSON.stringify(error.response.errors, null, 2));
      }
    }
    
    console.log('\n💡 This suggests the API token may be invalid or expired.');
    console.log('   Please create a new Railway API token at: https://railway.app/account/tokens');
  }
}

testToken(); 