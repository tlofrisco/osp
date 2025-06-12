#!/usr/bin/env node

/**
 * 🧪 ALTERNATIVE APPROACHES TEST
 * 
 * Tests different approaches to connect Railway services to GitHub:
 * - ServiceUpdate with source configuration
 * - Direct deployment with source information
 * - Service creation with pre-configured source
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

console.log('🧪 TESTING ALTERNATIVE APPROACHES');
console.log('==================================');

// Find an existing test service to work with
async function getTestService() {
  const query = gql`
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
                rootDirectory
              }
            }
          }
        }
      }
    }
  `;

  try {
    const response = await client.request(query, {
      projectId: process.env.RAILWAY_PROJECT_ID
    });
    
    const services = response.project.services.edges;
    const testService = services.find(edge => 
      edge.node.name.includes('complete_automation') && !edge.node.source?.repo
    );
    
    if (testService) {
      console.log(`🎯 Using test service: ${testService.node.name}`);
      console.log(`📋 Service ID: ${testService.node.id}`);
      return testService.node;
    } else {
      console.log('ℹ️ No suitable test service found');
      return null;
    }
  } catch (error) {
    console.log('❌ Failed to get test service:', error.message);
    return null;
  }
}

// Approach 1: ServiceUpdate with source configuration
async function testServiceUpdateApproach(serviceId) {
  console.log('\n📋 Approach 1: Testing ServiceUpdate with source...');
  
  const updateMutation = gql`
    mutation UpdateServiceSource($serviceId: String!, $input: ServiceUpdateInput!) {
      serviceUpdate(id: $serviceId, input: $input) {
        id
        name
        source {
          repo
          branch
          rootDirectory
        }
      }
    }
  `;

  const updateInput = {
    source: {
      repo: "tlofrisco/osp",
      branch: "main",
      rootDirectory: "/workers"
    }
  };

  try {
    const response = await client.request(updateMutation, {
      serviceId: serviceId,
      input: updateInput
    });
    
    console.log('✅ ServiceUpdate succeeded!');
    console.log(`   Service: ${response.serviceUpdate.name}`);
    console.log(`   Source: ${response.serviceUpdate.source?.repo}@${response.serviceUpdate.source?.branch}`);
    console.log(`   Root Directory: ${response.serviceUpdate.source?.rootDirectory}`);
    
    return { success: true, approach: 'serviceUpdate', result: response.serviceUpdate };
  } catch (error) {
    console.log('❌ ServiceUpdate failed:', error.message);
    return { success: false, approach: 'serviceUpdate', error: error.message };
  }
}

// Approach 2: Create service with source from the beginning
async function testCreateServiceWithSource() {
  console.log('\n📋 Approach 2: Testing service creation with source...');
  
  const createMutation = gql`
    mutation CreateServiceWithSource($input: ServiceCreateInput!) {
      serviceCreate(input: $input) {
        id
        name
        source {
          repo
          branch
          rootDirectory
        }
      }
    }
  `;

  const createInput = {
    name: `osp-worker-test-with-source-${Date.now()}`,
    projectId: process.env.RAILWAY_PROJECT_ID,
    source: {
      repo: "tlofrisco/osp",
      branch: "main",
      rootDirectory: "/workers"
    }
  };

  try {
    const response = await client.request(createMutation, {
      input: createInput
    });
    
    console.log('✅ Service creation with source succeeded!');
    console.log(`   Service: ${response.serviceCreate.name}`);
    console.log(`   Service ID: ${response.serviceCreate.id}`);
    console.log(`   Source: ${response.serviceCreate.source?.repo}@${response.serviceCreate.source?.branch}`);
    
    return { 
      success: true, 
      approach: 'createWithSource', 
      result: response.serviceCreate,
      serviceId: response.serviceCreate.id 
    };
  } catch (error) {
    console.log('❌ Service creation with source failed:', error.message);
    return { success: false, approach: 'createWithSource', error: error.message };
  }
}

// Approach 3: Test deployment after source configuration
async function testDeploymentAfterSource(serviceId) {
  console.log('\n📋 Approach 3: Testing deployment with configured source...');
  
  const deployMutation = gql`
    mutation CreateDeployment($input: DeploymentCreateInput!) {
      deploymentCreate(input: $input) {
        id
        status
        meta
      }
    }
  `;

  try {
    const response = await client.request(deployMutation, {
      input: {
        projectId: process.env.RAILWAY_PROJECT_ID,
        environmentId: process.env.RAILWAY_ENVIRONMENT_ID,
        serviceId: serviceId
      }
    });
    
    console.log('✅ Deployment succeeded!');
    console.log(`   Deployment ID: ${response.deploymentCreate.id}`);
    console.log(`   Status: ${response.deploymentCreate.status}`);
    
    return { success: true, approach: 'deployment', result: response.deploymentCreate };
  } catch (error) {
    console.log('❌ Deployment failed:', error.message);
    return { success: false, approach: 'deployment', error: error.message };
  }
}

// Approach 4: Alternative service connection approaches
async function testAlternativeConnections(serviceId) {
  console.log('\n📋 Approach 4: Testing alternative connection methods...');
  
  // Try different variations of serviceConnect
  const alternatives = [
    {
      name: 'serviceConnect with rootDirectory',
      input: {
        serviceId: serviceId,
        repo: "tlofrisco/osp",
        branch: "main",
        rootDirectory: "/workers"
      }
    },
    {
      name: 'serviceConnect with image field',
      input: {
        serviceId: serviceId,
        repo: "tlofrisco/osp",
        branch: "main",
        image: null
      }
    },
    {
      name: 'serviceConnect minimal',
      input: {
        serviceId: serviceId,
        repo: "tlofrisco/osp"
      }
    }
  ];

  const connectMutation = gql`
    mutation ConnectService($input: ServiceConnectInput!) {
      serviceConnect(input: $input)
    }
  `;

  for (const alternative of alternatives) {
    console.log(`\n   Testing: ${alternative.name}`);
    try {
      await client.request(connectMutation, { input: alternative.input });
      console.log(`   ✅ ${alternative.name} succeeded!`);
      return { success: true, approach: alternative.name };
    } catch (error) {
      console.log(`   ❌ ${alternative.name} failed: ${error.message}`);
    }
  }
  
  return { success: false, approach: 'alternativeConnections', error: 'All alternatives failed' };
}

// Main test execution
async function runTests() {
  const results = [];
  
  // Get a test service
  const testService = await getTestService();
  
  if (testService) {
    // Test Approach 1: ServiceUpdate
    const updateResult = await testServiceUpdateApproach(testService.id);
    results.push(updateResult);
    
    // If ServiceUpdate worked, test deployment
    if (updateResult.success) {
      const deployResult = await testDeploymentAfterSource(testService.id);
      results.push(deployResult);
    }
    
    // Test Approach 4: Alternative connections (only if update failed)
    if (!updateResult.success) {
      const altResult = await testAlternativeConnections(testService.id);
      results.push(altResult);
    }
  }
  
  // Test Approach 2: Create service with source
  const createResult = await testCreateServiceWithSource();
  results.push(createResult);
  
  // If creation with source worked, test deployment
  if (createResult.success) {
    const deployResult = await testDeploymentAfterSource(createResult.serviceId);
    results.push(deployResult);
  }
  
  // Summary
  console.log('\n🎯 TEST RESULTS SUMMARY');
  console.log('=======================');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Successful approaches: ${successful.length}`);
  successful.forEach(result => {
    console.log(`   • ${result.approach}: SUCCESS`);
  });
  
  console.log(`\n❌ Failed approaches: ${failed.length}`);
  failed.forEach(result => {
    console.log(`   • ${result.approach}: ${result.error}`);
  });
  
  if (successful.length > 0) {
    console.log('\n🎉 SOLUTION FOUND!');
    console.log('We have working approaches for Railway automation.');
    console.log('Next step: Implement the successful approach in queueWorkerBuild.js');
  } else {
    console.log('\n⚠️ NO WORKING SOLUTIONS FOUND');
    console.log('All tested approaches failed. Consider:');
    console.log('1. Railway support contact for API limitations');
    console.log('2. Service template workaround approach');
    console.log('3. Railway CLI integration as backup');
  }
}

// Run the tests
runTests().catch(console.error); 