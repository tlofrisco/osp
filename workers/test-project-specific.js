#!/usr/bin/env node

/**
 * Test Railway API with project-specific queries
 */

import { GraphQLClient, gql } from 'graphql-request';
import fs from 'fs';
import path from 'path';

// Load environment
const envPath = path.join(process.cwd(), '..', '.env');
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
}

const RAILWAY_TOKEN = process.env.RAILWAY_TOKEN;
const RAILWAY_PROJECT_ID = process.env.RAILWAY_PROJECT_ID;

console.log('🧪 Testing Railway API with project-specific queries...\n');
console.log(`🔑 Token: ${RAILWAY_TOKEN ? `${RAILWAY_TOKEN.substring(0, 8)}...` : 'NOT SET'}`);
console.log(`📂 Project ID: ${RAILWAY_PROJECT_ID}\n`);

const client = new GraphQLClient('https://backboard.railway.app/graphql/v2', {
  headers: {
    authorization: `Bearer ${RAILWAY_TOKEN}`,
  },
});

async function testProjectQueries() {
  try {
    // Test 1: Direct project query
    console.log('📋 Test 1: Project info query...');
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
    
    console.log('✅ Project query successful!');
    console.log(`   Project: ${projectResult.project.name}`);
    console.log(`   Description: ${projectResult.project.description || 'None'}\n`);
    
    // Test 2: Services in project (simplified query)
    console.log('📋 Test 2: Services query...');
    const servicesQuery = gql`
      query GetServices($projectId: String!) {
        project(id: $projectId) {
          services {
            edges {
              node {
                id
                name
              }
            }
          }
        }
      }
    `;
    
    const servicesResult = await client.request(servicesQuery, {
      projectId: RAILWAY_PROJECT_ID
    });
    
    console.log('✅ Services query successful!');
    const services = servicesResult.project.services.edges;
    console.log(`   Found ${services.length} services:`);
    services.forEach(service => {
      console.log(`   - ${service.node.name} (ID: ${service.node.id})`);
    });
    
    console.log('\n🎉 Project-specific queries work! The token has project access.');
    console.log('💡 Consider creating a Personal Account Token for full functionality.');
    
  } catch (error) {
    console.error('❌ Project query failed:', error.message);
    
    if (error.response?.errors) {
      console.error('GraphQL Errors:', JSON.stringify(error.response.errors, null, 2));
    }
    
    console.log('\n🔍 This suggests the token might be invalid or lack project permissions.');
    console.log('Please create a new Personal Account Token at: https://railway.app/account/tokens');
  }
}

testProjectQueries(); 