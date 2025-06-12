#!/usr/bin/env node

/**
 * Basic Railway API authentication test
 * 
 * This verifies that our Railway API credentials work by:
 * 1. Testing basic authentication with the 'me' query
 * 2. Checking if we can fetch the project
 * 3. Using introspection to understand the available schema
 */

import { GraphQLClient, gql } from 'graphql-request';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize GraphQL client
const client = new GraphQLClient('https://backboard.railway.app/graphql/v2', {
  headers: {
    authorization: `Bearer ${process.env.RAILWAY_API_TOKEN}`,
  },
});

async function testBasicAuth() {
  console.log('🔐 Testing Railway API Authentication\n');
  
  try {
    // Test 1: Basic user query
    console.log('📋 Test 1: Testing basic authentication with "me" query...');
    const meQuery = gql`
      query Me {
        me {
          id
          name
          email
        }
      }
    `;
    
    const meResult = await client.request(meQuery);
    console.log('✅ Authentication successful!');
    console.log(`   User: ${meResult.me.name} (${meResult.me.email})\n`);
    
    // Test 2: Try to fetch project info
    console.log('📋 Test 2: Testing project query...');
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
      projectId: process.env.RAILWAY_PROJECT_ID
    });
    console.log('✅ Project query successful!');
    console.log(`   Project: ${projectResult.project.name}\n`);
    
    // Test 3: Try to introspect types related to services
    console.log('📋 Test 3: Introspecting service-related types...');
    const introspectionQuery = gql`
      query IntrospectService {
        __schema {
          mutationType {
            fields {
              name
              description
            }
          }
        }
      }
    `;
    
    const introspectionResult = await client.request(introspectionQuery);
    const serviceMutations = introspectionResult.__schema.mutationType.fields
      .filter(field => field.name.toLowerCase().includes('service'))
      .slice(0, 10); // Just show first 10
    
    console.log('✅ Found service-related mutations:');
    serviceMutations.forEach(mutation => {
      console.log(`   - ${mutation.name}: ${mutation.description || 'No description'}`);
    });
    
    console.log('\n🎉 All authentication tests passed!');
    
  } catch (error) {
    console.error('❌ Authentication test failed:', error);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
    }
    process.exit(1);
  }
}

// Run the test
testBasicAuth(); 