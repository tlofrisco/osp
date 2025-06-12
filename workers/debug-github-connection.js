#!/usr/bin/env node

/**
 * 🔍 DEBUG GITHUB CONNECTION
 * 
 * Investigates why serviceConnect is still failing with 400 errors
 * despite the GitHub App being installed
 */

import { GraphQLClient, gql } from 'graphql-request';
import fs from 'fs';
import path from 'path';

// Load environment from parent directory  
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

const client = new GraphQLClient('https://backboard.railway.app/graphql/v2', {
  headers: {
    authorization: `Bearer ${process.env.RAILWAY_TOKEN}`,
  },
});

console.log('🔍 DEBUG: GitHub Connection Issues');
console.log('==================================');

// Step 1: Check if GitHub App is connected to the project
console.log('📋 Step 1: Checking project GitHub connection status...\n');

const projectQuery = gql`
  query GetProjectDetails($projectId: String!) {
    project(id: $projectId) {
      id
      name
      plugins {
        id
        name
      }
      environments {
        edges {
          node {
            id
            name
          }
        }
      }
      services {
        edges {
          node {
            id
            name
            source {
              repo
              branch
            }
          }
        }
      }
    }
  }
`;

try {
  const projectResponse = await client.request(projectQuery, {
    projectId: process.env.RAILWAY_PROJECT_ID
  });
  
  console.log('✅ Project Details:');
  console.log(`   Name: ${projectResponse.project.name}`);
  console.log(`   ID: ${projectResponse.project.id}`);
  console.log(`   Plugins: ${projectResponse.project.plugins?.length || 0}`);
  console.log(`   Services: ${projectResponse.project.services.edges.length}`);
  
  // Check which services have GitHub connections
  const servicesWithGitHub = projectResponse.project.services.edges.filter(
    edge => edge.node.source?.repo
  );
  
  console.log(`\n🔗 Services with GitHub connections: ${servicesWithGitHub.length}`);
  servicesWithGitHub.forEach(edge => {
    console.log(`   ✅ ${edge.node.name}: ${edge.node.source.repo}@${edge.node.source.branch}`);
  });
  
  const servicesWithoutGitHub = projectResponse.project.services.edges.filter(
    edge => !edge.node.source?.repo
  );
  
  console.log(`\n❌ Services WITHOUT GitHub connections: ${servicesWithoutGitHub.length}`);
  servicesWithoutGitHub.forEach(edge => {
    console.log(`   ❌ ${edge.node.name} (ID: ${edge.node.id})`);
  });

} catch (error) {
  console.error('❌ Failed to get project details:', error.message);
}

// Step 2: Try connecting a specific service to understand the error
console.log('\n📋 Step 2: Testing serviceConnect mutation directly...\n');

// Find a service to test with
const serviceQuery = gql`
  query GetServices($projectId: String!) {
    project(id: $projectId) {
      services {
        edges {
          node {
            id
            name
            source {
              repo
              branch
            }
          }
        }
      }
    }
  }
`;

try {
  const servicesResponse = await client.request(serviceQuery, {
    projectId: process.env.RAILWAY_PROJECT_ID
  });
  
  const testService = servicesResponse.project.services.edges.find(
    edge => edge.node.name.includes('complete_automation') || edge.node.name.includes('osp-worker')
  );
  
  if (testService && !testService.node.source?.repo) {
    console.log(`🎯 Testing GitHub connection on: ${testService.node.name}`);
    console.log(`   Service ID: ${testService.node.id}`);
    
    const connectMutation = gql`
      mutation ConnectService($input: ServiceConnectInput!) {
        serviceConnect(input: $input)
      }
    `;

    const connectInput = {
      input: {
        serviceId: testService.node.id,
        repo: 'tlofrisco/osp',
        branch: 'main'
      }
    };
    
    console.log('🔗 Attempting connection with input:', JSON.stringify(connectInput, null, 2));
    
    try {
      await client.request(connectMutation, connectInput);
      console.log('✅ SUCCESS: GitHub connection worked!');
    } catch (connectError) {
      console.log('❌ GitHub connection failed with detailed error:');
      console.log('   Status:', connectError.response?.status);
      console.log('   Error:', connectError.message);
      
      // Try to get more detailed error information
      if (connectError.response?.errors) {
        console.log('   GraphQL Errors:', JSON.stringify(connectError.response.errors, null, 2));
      }
    }
  } else {
    console.log('ℹ️ No suitable test service found or service already connected');
  }
  
} catch (error) {
  console.error('❌ Failed to test service connection:', error.message);
}

console.log('\n🔍 DEBUGGING COMPLETE');
console.log('=====================');
console.log('If GitHub connections are working for some services but not others,');
console.log('the issue may be with specific service configuration or timing.'); 