/**
 * 🧪 Temporal Cloud Connection Test
 */

import { json } from '@sveltejs/kit';
import { checkTemporalHealth, createTemporalClient } from '$lib/temporal/client';
import { 
  TEMPORAL_CLOUD_ENDPOINT, 
  TEMPORAL_CLOUD_NAMESPACE, 
  TEMPORAL_API_KEY 
} from '$env/static/private';

export async function GET() {
  try {
    console.log('🧪 Testing Temporal Cloud connection...');
    console.log('Endpoint:', TEMPORAL_CLOUD_ENDPOINT);
    console.log('Namespace:', TEMPORAL_CLOUD_NAMESPACE);
    console.log('API Key present:', !!TEMPORAL_API_KEY);
    
    // Test basic connection
    const isHealthy = await checkTemporalHealth();
    
    if (isHealthy) {
      const client = await createTemporalClient();
      
      // Simple connection test - don't try to list workflows yet
      return json({
        success: true,
        message: '✅ Temporal Cloud connection successful!',
        namespace: TEMPORAL_CLOUD_NAMESPACE,
        endpoint: TEMPORAL_CLOUD_ENDPOINT,
        authMethod: 'API Key',
        apiKeyPrefix: TEMPORAL_API_KEY?.substring(0, 10) + '...'
      });
    } else {
      throw new Error('Health check failed');
    }
    
  } catch (error) {
    console.error('❌ Temporal test failed:', error);
    
    return json({
      success: false,
      message: '❌ Temporal Cloud connection failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      namespace: TEMPORAL_CLOUD_NAMESPACE,
      endpoint: TEMPORAL_CLOUD_ENDPOINT,
      authMethod: 'API Key',
      apiKeyPresent: !!TEMPORAL_API_KEY,
      apiKeyPrefix: TEMPORAL_API_KEY?.substring(0, 10) + '...'
    }, { status: 500 });
  }
}