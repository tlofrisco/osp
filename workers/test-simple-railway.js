#!/usr/bin/env node

/**
 * Simple Railway API test with minimal permissions
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

const RAILWAY_TOKEN = process.env.RAILWAY_TOKEN;
console.log(`🔑 Testing token: ${RAILWAY_TOKEN ? `${RAILWAY_TOKEN.substring(0, 8)}...${RAILWAY_TOKEN.substring(-4)}` : 'NOT SET'}`);

if (!RAILWAY_TOKEN) {
  console.log('❌ RAILWAY_TOKEN not found!');
  process.exit(1);
}

const client = new GraphQLClient('https://backboard.railway.app/graphql/v2', {
  headers: {
    authorization: `Bearer ${RAILWAY_TOKEN}`,
  },
});

async function testSimpleQueries() {
  console.log('🧪 Testing Railway API with simple queries...\n');
  
  try {
    // Test 1: Schema introspection (should work with any valid token)
    console.log('📋 Test 1: Schema introspection...');
    const introspectionQuery = gql`
      query {
        __schema {
          queryType {
            name
          }
        }
      }
    `;
    
    await client.request(introspectionQuery);
    console.log('✅ Schema introspection successful - token is valid!\n');
    
    // Test 2: Try the "me" query again
    console.log('📋 Test 2: User info query...');
    const meQuery = gql`
      query {
        me {
          id
          name
        }
      }
    `;
    
    const result = await client.request(meQuery);
    console.log('✅ User query successful!');
    console.log(`   User: ${result.me.name} (ID: ${result.me.id})\n`);
    
    // Test 3: Projects query
    console.log('📋 Test 3: Projects query...');
    const projectsQuery = gql`
      query {
        projects {
          edges {
            node {
              id
              name
            }
          }
        }
      }
    `;
    
    const projectsResult = await client.request(projectsQuery);
    console.log('✅ Projects query successful!');
    console.log(`   Found ${projectsResult.projects.edges.length} projects`);
    
    console.log('\n🎉 All tests passed! Token is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.response?.errors) {
      console.error('GraphQL Errors:', JSON.stringify(error.response.errors, null, 2));
    }
    
    if (error.message.includes('Not Authorized')) {
      console.log('\n🔍 Token Troubleshooting:');
      console.log('1. Verify the token was created at: https://railway.app/account/tokens');
      console.log('2. Make sure you copied the FULL token (not just part of it)');
      console.log('3. Check that the token has the correct permissions');
      console.log('4. Try creating a new "Account Token" (not team token)');
      console.log(`5. Token format: Your token is ${RAILWAY_TOKEN.length} characters long`);
      console.log(`   Expected: Railway tokens are usually 36 characters (UUID format)`);
    }
  }
}

testSimpleQueries(); 