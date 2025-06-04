/**
 * 🔄 Temporal Cloud Client Configuration for OSP
 * 
 * Handles connection to Temporal Cloud with multi-namespace support for service isolation.
 * Each OSP service gets its own Temporal namespace for workflow isolation.
 */

import { Client, Connection } from '@temporalio/client';
import { 
  TEMPORAL_CLOUD_ENDPOINT, 
  TEMPORAL_CLOUD_NAMESPACE, 
  TEMPORAL_API_KEY
} from '$env/static/private';

// Connection cache for efficiency
const connectionCache = new Map<string, Connection>();
const clientCache = new Map<string, Client>();

/**
 * Create a connection to Temporal Cloud (supports both API Key and Certificate auth)
 */
async function createTemporalConnection(): Promise<Connection> {
  const cacheKey = 'default';
  
  if (connectionCache.has(cacheKey)) {
    return connectionCache.get(cacheKey)!;
  }

  const endpoint = TEMPORAL_CLOUD_ENDPOINT || 'quickstart-osp.v5egj.tmprl.cloud:7233';
  const namespace = TEMPORAL_CLOUD_NAMESPACE || 'quickstart-osp.v5egj';

  console.log('🔧 Creating Temporal connection...');
  console.log('🔧 Endpoint:', endpoint);
  console.log('🔧 Namespace:', namespace);

  // Method 1: API Key Authentication (SDK v1.10.0+)
  if (TEMPORAL_API_KEY) {
    console.log('🔑 Using Temporal Cloud API Key authentication (SDK v1.11.8)');
    console.log('🔑 API Key prefix:', TEMPORAL_API_KEY.substring(0, 15) + '...');
    
    try {
      const connection = await Connection.connect({
        address: endpoint,
        tls: true,
        apiKey: TEMPORAL_API_KEY,
        metadata: {
          'temporal-namespace': namespace,
        },
      });
      
      connectionCache.set(cacheKey, connection);
      console.log('✅ Temporal Cloud connection established');
      return connection;
    } catch (error) {
      console.error('❌ Failed to connect with API key:', error);
      throw error;
    }
  }
  // Method 2: No authentication configured
  else {
    console.log('⚠️ No authentication configured');
    throw new Error('TEMPORAL_API_KEY must be provided');
  }
}

/**
 * Create a Temporal client for a specific namespace (service)
 */
export async function createTemporalClient(namespace?: string): Promise<Client> {
  const targetNamespace = namespace || TEMPORAL_CLOUD_NAMESPACE || 'quickstart-osp.v5egj';
  
  if (clientCache.has(targetNamespace)) {
    return clientCache.get(targetNamespace)!;
  }

  const connection = await createTemporalConnection();
  
  const client = new Client({
    connection,
    namespace: targetNamespace,
  });

  clientCache.set(targetNamespace, client);
  console.log(`📋 Temporal client created for namespace: ${targetNamespace}`);
  return client;
}

/**
 * Generate a Temporal namespace name for an OSP service
 */
export function generateNamespace(serviceSchema: string): string {
  // Temporal namespace naming rules: alphanumeric, hyphens, max 64 chars
  const namespace = `osp-${serviceSchema}`
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60); // Leave room for potential suffix
    
  return namespace;
}

/**
 * Generate task queue name for a service
 */
export function generateTaskQueue(serviceSchema: string): string {
  return `${serviceSchema}-tasks`;
}

/**
 * Create namespace for a new OSP service
 * Note: Temporal Cloud namespaces are managed via their web console or CLI
 * For now, we'll use a single namespace with service prefixes in workflow IDs
 */
export async function ensureServiceNamespace(serviceSchema: string): Promise<string> {
  // For Phase 1, we'll use a single namespace with service prefixes
  // Later, we can implement proper namespace creation via Temporal Cloud API
  const namespace = TEMPORAL_CLOUD_NAMESPACE || 'quickstart-osp.v5egj';
  
  // TODO: Implement actual namespace creation when Temporal Cloud API supports it
  console.log(`📋 Service ${serviceSchema} will use namespace: ${namespace}`);
  
  return namespace;
}

/**
 * Get the OSP core namespace for platform workflows
 */
export function getOSPCoreNamespace(): string {
  return TEMPORAL_CLOUD_NAMESPACE || 'quickstart-osp.v5egj';
}

/**
 * Health check for Temporal connection
 */
export async function checkTemporalHealth(): Promise<boolean> {
  try {
    console.log('🔍 Health check starting...');
    const client = await createTemporalClient();
    console.log('✅ Temporal health check passed');
    return true;
  } catch (error) {
    console.error('❌ Temporal health check failed:', error);
    return false;
  }
}

/**
 * Close all connections (for cleanup)
 */
export async function closeTemporalConnections(): Promise<void> {
  for (const connection of connectionCache.values()) {
    connection.close();
  }
  connectionCache.clear();
  clientCache.clear();
}

/**
 * 🔄 TemporalClient Class Wrapper
 * 
 * Provides a class-based interface for the workflow orchestrator
 */
export class TemporalClient {
  private namespace?: string;

  constructor(namespace?: string) {
    this.namespace = namespace;
  }

  async getClient(): Promise<Client> {
    return await createTemporalClient(this.namespace);
  }

  async healthCheck(): Promise<boolean> {
    return await checkTemporalHealth();
  }

  generateTaskQueue(serviceSchema: string): string {
    return generateTaskQueue(serviceSchema);
  }

  generateNamespace(serviceSchema: string): string {
    return generateNamespace(serviceSchema);
  }

  async ensureServiceNamespace(serviceSchema: string): Promise<string> {
    return await ensureServiceNamespace(serviceSchema);
  }
}