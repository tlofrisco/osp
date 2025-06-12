#!/usr/bin/env node

/**
 * 🔍 RAILWAY SCHEMA INVESTIGATION
 * 
 * Introspects Railway's GraphQL schema to understand:
 * - ServiceConnectInput required fields
 * - ServiceUpdateInput alternatives
 * - Missing parameters that might cause 400 errors
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

console.log('🔍 RAILWAY GRAPHQL SCHEMA INVESTIGATION');
console.log('=======================================');

// Step 1: Introspect ServiceConnectInput
console.log('📋 Step 1: Investigating ServiceConnectInput schema...\n');

const serviceConnectInputQuery = gql`
  query IntrospectServiceConnectInput {
    __type(name: "ServiceConnectInput") {
      name
      kind
      fields {
        name
        type {
          name
          kind
          ofType {
            name
            kind
          }
        }
        description
      }
    }
  }
`;

try {
  const response = await client.request(serviceConnectInputQuery);
  const type = response.__type;
  
  if (type) {
    console.log(`✅ ServiceConnectInput found:`);
    console.log(`   Type: ${type.kind}`);
    console.log(`   Fields: ${type.fields?.length || 0}`);
    
    if (type.fields) {
      console.log('\n📋 Available Fields:');
      type.fields.forEach(field => {
        const typeInfo = field.type.name || field.type.ofType?.name || field.type.kind;
        console.log(`   • ${field.name}: ${typeInfo}`);
        if (field.description) {
          console.log(`     Description: ${field.description}`);
        }
      });
    }
  } else {
    console.log('❌ ServiceConnectInput type not found');
  }
} catch (error) {
  console.log('❌ Failed to introspect ServiceConnectInput:', error.message);
}

// Step 2: Introspect ServiceUpdateInput
console.log('\n📋 Step 2: Investigating ServiceUpdateInput as alternative...\n');

const serviceUpdateInputQuery = gql`
  query IntrospectServiceUpdateInput {
    __type(name: "ServiceUpdateInput") {
      name
      kind
      fields {
        name
        type {
          name
          kind
          ofType {
            name
            kind
          }
        }
        description
      }
    }
  }
`;

try {
  const response = await client.request(serviceUpdateInputQuery);
  const type = response.__type;
  
  if (type) {
    console.log(`✅ ServiceUpdateInput found:`);
    console.log(`   Type: ${type.kind}`);
    console.log(`   Fields: ${type.fields?.length || 0}`);
    
    if (type.fields) {
      console.log('\n📋 Available Fields:');
      type.fields.forEach(field => {
        const typeInfo = field.type.name || field.type.ofType?.name || field.type.kind;
        console.log(`   • ${field.name}: ${typeInfo}`);
        if (field.description) {
          console.log(`     Description: ${field.description}`);
        }
      });
      
      // Check if source field exists
      const sourceField = type.fields.find(f => f.name === 'source');
      if (sourceField) {
        console.log('\n🎯 FOUND SOURCE FIELD! This could be our solution.');
        console.log('   ServiceUpdateInput supports source configuration.');
      }
    }
  } else {
    console.log('❌ ServiceUpdateInput type not found');
  }
} catch (error) {
  console.log('❌ Failed to introspect ServiceUpdateInput:', error.message);
}

// Step 3: Look for ServiceSourceInput
console.log('\n📋 Step 3: Investigating ServiceSourceInput...\n');

const serviceSourceInputQuery = gql`
  query IntrospectServiceSourceInput {
    __type(name: "ServiceSourceInput") {
      name
      kind
      fields {
        name
        type {
          name
          kind
          ofType {
            name
            kind
          }
        }
        description
      }
    }
  }
`;

try {
  const response = await client.request(serviceSourceInputQuery);
  const type = response.__type;
  
  if (type) {
    console.log(`✅ ServiceSourceInput found:`);
    console.log(`   Type: ${type.kind}`);
    console.log(`   Fields: ${type.fields?.length || 0}`);
    
    if (type.fields) {
      console.log('\n📋 Available Fields:');
      type.fields.forEach(field => {
        const typeInfo = field.type.name || field.type.ofType?.name || field.type.kind;
        console.log(`   • ${field.name}: ${typeInfo}`);
        if (field.description) {
          console.log(`     Description: ${field.description}`);
        }
      });
    }
  } else {
    console.log('❌ ServiceSourceInput type not found');
  }
} catch (error) {
  console.log('❌ Failed to introspect ServiceSourceInput:', error.message);
}

// Step 4: General introspection for service-related types
console.log('\n📋 Step 4: Searching for all service-related input types...\n');

const allTypesQuery = gql`
  query GetAllTypes {
    __schema {
      types {
        name
        kind
      }
    }
  }
`;

try {
  const response = await client.request(allTypesQuery);
  const types = response.__schema.types;
  
  const serviceTypes = types.filter(type => 
    type.name.toLowerCase().includes('service') && 
    type.name.toLowerCase().includes('input')
  );
  
  console.log(`🔍 Found ${serviceTypes.length} service-related input types:`);
  serviceTypes.forEach(type => {
    console.log(`   • ${type.name} (${type.kind})`);
  });
  
} catch (error) {
  console.log('❌ Failed to get all types:', error.message);
}

console.log('\n🔍 INVESTIGATION COMPLETE');
console.log('=========================');
console.log('📋 Next Steps:');
console.log('1. Review discovered fields for missing parameters');
console.log('2. Test ServiceUpdateInput approach if source field exists');
console.log('3. Try alternative input types discovered');
console.log('4. Contact Railway support with specific field requirements'); 