/**
 * Railway API Service Module
 * 
 * Handles programmatic Railway service creation and management
 * via Railway's GraphQL API v2
 * 
 * Service-agnostic - works with any dynamically created service
 */

import { GraphQLClient, gql } from 'graphql-request';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Validate required Railway environment variables
const requiredEnvVars = ['RAILWAY_API_TOKEN', 'RAILWAY_PROJECT_ID', 'RAILWAY_ENVIRONMENT_ID'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`);
    console.error('Please add it to your .env file');
    process.exit(1);
  }
}

// Initialize GraphQL client
const client = new GraphQLClient('https://backboard.railway.app/graphql/v2', {
  headers: {
    authorization: `Bearer ${process.env.RAILWAY_API_TOKEN}`,
  },
});

/**
 * Create a new Railway service for a given service schema
 * @param {string} serviceSchema - The unique service schema identifier
 * @returns {Promise<string>} The Railway service ID
 */
export async function createRailwayService(serviceSchema) {
  console.log(`🚂 Creating Railway service for: ${serviceSchema}`);
  
  const mutation = gql`
    mutation CreateService($input: ServiceCreateInput!) {
      serviceCreate(input: $input) {
        id
        name
      }
    }
  `;

  const variables = {
    input: {
      name: `osp-worker-${serviceSchema}`,
      projectId: process.env.RAILWAY_PROJECT_ID,
      source: {
        repo: {
          // Point to the GitHub repo - this should come from env vars
          repo: process.env.GITHUB_REPO || 'your-org/osp',
          branch: process.env.GITHUB_BRANCH || 'main',
          // Set the root directory to /workers
          rootDirectory: '/workers'
        }
      }
    }
  };

  try {
    const response = await client.request(mutation, variables);
    const serviceId = response.serviceCreate.id;
    console.log(`✅ Railway service created: ${response.serviceCreate.name} (ID: ${serviceId})`);
    return serviceId;
  } catch (error) {
    // Check if service already exists
    if (error.response?.errors?.[0]?.message?.includes('already exists')) {
      console.log(`ℹ️ Railway service already exists for ${serviceSchema}, fetching ID...`);
      return await getRailwayServiceId(serviceSchema);
    }
    console.error('❌ Failed to create Railway service:', error);
    throw error;
  }
}

/**
 * Get Railway service ID by service schema name
 * @param {string} serviceSchema - The service schema identifier
 * @returns {Promise<string|null>} The Railway service ID or null if not found
 */
export async function getRailwayServiceId(serviceSchema) {
  const query = gql`
    query GetServices($projectId: String!, $environmentId: String!) {
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

  const variables = {
    projectId: process.env.RAILWAY_PROJECT_ID,
    environmentId: process.env.RAILWAY_ENVIRONMENT_ID
  };

  try {
    const response = await client.request(query, variables);
    const services = response.project.services.edges;
    const targetServiceName = `osp-worker-${serviceSchema}`;
    
    const service = services.find(edge => edge.node.name === targetServiceName);
    return service ? service.node.id : null;
  } catch (error) {
    console.error('❌ Failed to get Railway services:', error);
    return null;
  }
}

/**
 * Set environment variables for a Railway service
 * @param {string} serviceId - The Railway service ID
 * @param {Object} variables - Key-value pairs of environment variables
 */
export async function setRailwayEnvironmentVariables(serviceId, variables) {
  console.log(`📝 Setting environment variables for Railway service ${serviceId}`);
  
  const mutation = gql`
    mutation UpsertVariables($input: VariableCollectionUpsertInput!) {
      variableCollectionUpsert(input: $input)
    }
  `;

  // Convert variables object to Railway's expected format
  const formattedVariables = Object.entries(variables).reduce((acc, [key, value]) => {
    acc[key] = value;
    return acc;
  }, {});

  const input = {
    input: {
      projectId: process.env.RAILWAY_PROJECT_ID,
      environmentId: process.env.RAILWAY_ENVIRONMENT_ID,
      serviceId: serviceId,
      variables: formattedVariables
    }
  };

  try {
    await client.request(mutation, input);
    console.log(`✅ Environment variables set successfully`);
    
    // Log which variables were set (without values for security)
    const varNames = Object.keys(variables);
    console.log(`   Variables set: ${varNames.join(', ')}`);
  } catch (error) {
    console.error('❌ Failed to set environment variables:', error);
    throw error;
  }
}

/**
 * Deploy a Railway service
 * @param {string} serviceId - The Railway service ID
 * @returns {Promise<string>} The deployment ID
 */
export async function deployRailwayService(serviceId) {
  console.log(`🚀 Deploying Railway service ${serviceId}`);
  
  const mutation = gql`
    mutation CreateDeployment($input: DeploymentCreateInput!) {
      deploymentCreate(input: $input) {
        id
        status
      }
    }
  `;

  const variables = {
    input: {
      projectId: process.env.RAILWAY_PROJECT_ID,
      environmentId: process.env.RAILWAY_ENVIRONMENT_ID,
      serviceId: serviceId
    }
  };

  try {
    const response = await client.request(mutation, variables);
    console.log(`✅ Deployment initiated: ${response.deploymentCreate.id}`);
    return response.deploymentCreate.id;
  } catch (error) {
    console.error('❌ Failed to deploy Railway service:', error);
    throw error;
  }
}

/**
 * Delete a Railway service (for rollback scenarios)
 * @param {string} serviceId - The Railway service ID
 */
export async function deleteRailwayService(serviceId) {
  console.log(`🗑️ Deleting Railway service ${serviceId}`);
  
  const mutation = gql`
    mutation DeleteService($id: String!) {
      serviceDelete(id: $id)
    }
  `;

  try {
    await client.request(mutation, { id: serviceId });
    console.log(`✅ Railway service deleted`);
  } catch (error) {
    console.error('❌ Failed to delete Railway service:', error);
    // Don't throw - deletion failure during rollback shouldn't stop the process
  }
} 