#!/usr/bin/env node

/**
 * Railway API Schema Introspection
 * 
 * This introspects the Railway API to find the correct service-related mutations
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

const client = new GraphQLClient('https://backboard.railway.app/graphql/v2', {
  headers: {
    authorization: `Bearer ${process.env.RAILWAY_TOKEN}`,
  },
});

async function introspectSchema() {
  console.log('🔍 Introspecting Railway GraphQL Schema...\n');
  
  try {
    // Get service-related mutations
    console.log('📋 Service-related Mutations:');
    const mutationsQuery = gql`
      query {
        __schema {
          mutationType {
            fields {
              name
              description
              args {
                name
                type {
                  name
                  kind
                  ofType {
                    name
                  }
                }
              }
            }
          }
        }
      }
    `;
    
    const result = await client.request(mutationsQuery);
    const mutations = result.__schema.mutationType.fields;
    
    // Filter service-related mutations
    const serviceMutations = mutations.filter(mutation => 
      mutation.name.toLowerCase().includes('service')
    );
    
    console.log(`Found ${serviceMutations.length} service-related mutations:\n`);
    
    serviceMutations.forEach(mutation => {
      console.log(`🔧 ${mutation.name}`);
      if (mutation.description) {
        console.log(`   Description: ${mutation.description}`);
      }
      if (mutation.args && mutation.args.length > 0) {
        console.log(`   Arguments:`);
        mutation.args.forEach(arg => {
          const typeName = arg.type.name || arg.type.ofType?.name || 'Unknown';
          console.log(`     - ${arg.name}: ${typeName}`);
        });
      }
      console.log('');
    });
    
    // Try to find the specific service create mutation
    const createServiceMutation = serviceMutations.find(m => 
      m.name.toLowerCase().includes('create') || 
      m.name.toLowerCase().includes('service')
    );
    
    if (createServiceMutation) {
      console.log(`🎯 Found service creation mutation: ${createServiceMutation.name}`);
      
      // Get the input type details
      const inputArg = createServiceMutation.args.find(arg => arg.name === 'input');
      if (inputArg) {
        console.log(`   Input type: ${inputArg.type.name || inputArg.type.ofType?.name}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Schema introspection failed:', error.message);
  }
}

introspectSchema(); 