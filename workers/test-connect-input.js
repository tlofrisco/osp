#!/usr/bin/env node

/**
 * Introspect ServiceConnectInput type to understand correct format
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

async function introspectConnectInput() {
  console.log('🔍 Introspecting ServiceConnectInput type...\n');
  
  try {
    const query = gql`
      query {
        __schema {
          types {
            name
            kind
            inputFields {
              name
              type {
                name
                kind
                ofType {
                  name
                  kind
                  inputFields {
                    name
                    type {
                      name
                      ofType {
                        name
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;
    
    const result = await client.request(query);
    const types = result.__schema.types;
    
    // Find ServiceConnectInput
    const connectInput = types.find(type => type.name === 'ServiceConnectInput');
    
    if (connectInput) {
      console.log('📋 ServiceConnectInput fields:');
      connectInput.inputFields.forEach(field => {
        const typeName = field.type.name || field.type.ofType?.name || 'Unknown';
        console.log(`   - ${field.name}: ${typeName}`);
        
        // If it's a nested input type, show its fields
        if (field.type.ofType?.inputFields) {
          console.log(`     Fields:`);
          field.type.ofType.inputFields.forEach(nestedField => {
            const nestedTypeName = nestedField.type.name || nestedField.type.ofType?.name || 'Unknown';
            console.log(`       - ${nestedField.name}: ${nestedTypeName}`);
          });
        }
      });
    } else {
      console.log('❌ ServiceConnectInput type not found');
    }
    
    // Also check for RepositoryInput or similar
    const repoInputs = types.filter(type => 
      type.name && (
        type.name.toLowerCase().includes('repo') || 
        type.name.toLowerCase().includes('git') ||
        type.name.toLowerCase().includes('source')
      )
    );
    
    if (repoInputs.length > 0) {
      console.log('\n📋 Repository/Source related input types:');
      repoInputs.forEach(type => {
        console.log(`\n🔧 ${type.name}:`);
        if (type.inputFields) {
          type.inputFields.forEach(field => {
            const typeName = field.type.name || field.type.ofType?.name || 'Unknown';
            console.log(`   - ${field.name}: ${typeName}`);
          });
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Introspection failed:', error.message);
  }
}

introspectConnectInput(); 