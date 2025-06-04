/**
 * 🧪 Test Workflow Orchestration API
 * 
 * Demonstrates the three-legged stool coherence system in action
 */

import { json } from '@sveltejs/kit';
import { workflowOrchestrator, type ServiceOperation } from '$lib/osp/dsl/workflowOrchestrator.js';
import type { BlendedModel, ServiceManifest } from '$lib/osp/types.js';

export async function GET() {
  console.log('🧪 Testing Workflow Orchestration and Coherence Monitor...');

  try {
    // 🎯 Create a test blended model (telecom service)
    const testBlendedModel: BlendedModel = {
      entities: {
        customer: {
          name: 'customer',
          fields: {
            id: { type: 'text', required: true },
            name: { type: 'text', required: true },
            email: { type: 'text', required: true },
            phone: { type: 'text', required: false },
            status: { type: 'text', required: true }
          },
          relationships: {}
        },
        service_order: {
          name: 'service_order',
          fields: {
            id: { type: 'text', required: true },
            order_date: { type: 'date', required: true },
            status: { type: 'text', required: true },
            total_amount: { type: 'number', required: true }
          },
          relationships: {
            customer: { target: 'customer', type: 'many_to_one' }
          }
        }
      },
      relationships: [],
      industryFrameworks: ['SID', 'ARTS']
    };

    // 🎨 Create test contract UI
    const testContractUI = {
      pages: [
        {
          id: 'customer_page',
          entity: 'customer',
          title: 'Customer Management',
          components: [
            {
              id: 'customer_form',
              type: 'form',
              config: {
                fields: [
                  { name: 'name', type: 'text', required: true },
                  { name: 'email', type: 'email', required: true },
                  { name: 'phone', type: 'text', required: false },
                  { name: 'status', type: 'select', required: true }
                ]
              }
            }
          ]
        }
      ],
      navigation: []
    };

    // ⚡ Create test workflows
    const testWorkflows = [
      {
        id: 'customer_creation_workflow',
        name: 'Customer Creation Workflow',
        description: 'Handles new customer onboarding',
        triggers: [
          {
            type: 'form_submit' as const,
            config: { form: 'customer_form' }
          }
        ],
        steps: [
          {
            id: 'validate_customer',
            type: 'activity' as const,
            activityType: 'validation',
            config: { validationType: 'customer_data' }
          },
          {
            id: 'create_customer_record',
            type: 'activity' as const,
            activityType: 'database_operation',
            config: { operation: 'insert', table: 'customer' }
          },
          {
            id: 'send_welcome_email',
            type: 'activity' as const,
            activityType: 'notification',
            config: { type: 'email', template: 'welcome' }
          }
        ],
        industryTraceability: {
          framework: 'SID',
          process: 'Customer Onboarding',
          standard: 'TMF632'
        }
      }
    ];

    // 📋 Create test service manifest
    const testManifest: ServiceManifest = {
      name: 'test-telecom-service',
      version: '1.0.0',
      description: 'Test telecom service for orchestration demo',
      blendedModel: testBlendedModel,
      contractUI: testContractUI,
      workflows: testWorkflows
    };

    // 🎭 Test different service operations
    const testResults = [];

    // Test 1: Service Creation
    console.log('🧪 Test 1: Service Creation');
    const serviceCreateOperation: ServiceOperation = {
      type: 'create',
      target: 'service',
      serviceName: 'test-telecom-service',
      details: {
        name: 'test-telecom-service',
        entities: ['customer', 'service_order'],
        frameworks: ['SID', 'ARTS']
      },
      userId: 'test-user'
    };

    const createResult = await workflowOrchestrator.orchestrateServiceOperation(
      serviceCreateOperation,
      testBlendedModel,
      testManifest
    );

    testResults.push({
      test: 'Service Creation',
      result: createResult
    });

    // Test 2: Entity Update (should trigger coherence monitoring)
    console.log('🧪 Test 2: Entity Update');
    const entityUpdateOperation: ServiceOperation = {
      type: 'update',
      target: 'entity',
      serviceName: 'test-telecom-service',
      details: {
        name: 'customer',
        newFields: [
          { name: 'loyalty_status', type: 'text', required: false }
        ]
      },
      userId: 'test-user'
    };

    const updateResult = await workflowOrchestrator.orchestrateServiceOperation(
      entityUpdateOperation,
      testBlendedModel,
      testManifest
    );

    testResults.push({
      test: 'Entity Update with Coherence Check',
      result: updateResult
    });

    // Test 3: Manual Workflow Trigger
    console.log('🧪 Test 3: Manual Workflow Trigger');
    try {
      const manualTriggerResult = await workflowOrchestrator.triggerWorkflow(
        'test-telecom-service',
        'customer_creation_workflow',
        {
          customerData: {
            name: 'John Doe',
            email: 'john@example.com',
            phone: '+1234567890',
            status: 'active'
          }
        },
        'test-user'
      );

      testResults.push({
        test: 'Manual Workflow Trigger',
        result: manualTriggerResult
      });
    } catch (error) {
      testResults.push({
        test: 'Manual Workflow Trigger',
        result: {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }

    // Test 4: Service Health Check
    console.log('🧪 Test 4: Service Health Check');
    const healthResult = await workflowOrchestrator.getServiceOrchestrationHealth('test-telecom-service');

    testResults.push({
      test: 'Service Health Check',
      result: healthResult
    });

    // 📊 Summary
    const summary = {
      totalTests: testResults.length,
      successfulTests: testResults.filter(t => 
        t.result.success !== false && !t.result.error
      ).length,
      coherenceScores: testResults
        .filter(t => t.result.coherenceResult)
        .map(t => ({
          test: t.test,
          valid: t.result.coherenceResult.valid,
          issues: t.result.coherenceResult.issues?.length || 0,
          suggestions: t.result.coherenceResult.suggestions?.length || 0
        })),
      workflowsTriggered: testResults
        .flatMap(t => t.result.workflowsTriggered || [])
        .filter(Boolean),
      managedServices: workflowOrchestrator.getManagedServices()
    };

    return json({
      success: true,
      message: '🎉 Workflow Orchestration Test Complete!',
      summary,
      testResults,
      demonstration: {
        title: '🔄 Three-Legged Stool Coherence System',
        description: 'This test demonstrates how OSP maintains coherence between Schema, UI, and Workflows',
        features: [
          '✅ Automatic workflow generation from blended models',
          '✅ Real-time coherence monitoring across all three legs',
          '✅ Automatic synchronization when changes are detected',
          '✅ Industry traceability (SID, ARTS, ITIL frameworks)',
          '✅ Workflow execution with step-by-step logging',
          '✅ Health monitoring and change history tracking'
        ],
        benefits: [
          '🚀 Zero-configuration workflow deployment',
          '🔄 Self-healing architecture prevents inconsistencies',
          '📊 Full observability into service operations',
          '🎯 Industry-standard compliance built-in',
          '⚡ Instant workflow triggers from UI actions',
          '🛡️ Proactive issue detection and auto-fixing'
        ]
      }
    });

  } catch (error) {
    console.error('❌ Orchestration test failed:', error);
    
    return json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown test error',
      message: '❌ Workflow Orchestration Test Failed',
      details: error
    }, { status: 500 });
  }
}

export async function POST({ request }) {
  console.log('🧪 Custom Workflow Orchestration Test...');

  try {
    const testParams = await request.json();
    
    // Allow custom test scenarios via POST
    const operation: ServiceOperation = {
      type: testParams.operationType || 'create',
      target: testParams.target || 'service',
      serviceName: testParams.serviceName || 'custom-test-service',
      details: testParams.details || {},
      userId: testParams.userId || 'test-user',
      context: testParams.context || {}
    };

    // Use provided model or create a simple test model
    const blendedModel: BlendedModel = testParams.blendedModel || {
      entities: {
        test_entity: {
          name: 'test_entity',
          fields: {
            id: { type: 'text', required: true },
            name: { type: 'text', required: true }
          },
          relationships: {}
        }
      },
      relationships: [],
      industryFrameworks: ['Custom']
    };

    const manifest: ServiceManifest = testParams.manifest || {
      name: operation.serviceName,
      version: '1.0.0',
      description: 'Custom test service',
      blendedModel,
      contractUI: { pages: [], navigation: [] },
      workflows: []
    };

    const result = await workflowOrchestrator.orchestrateServiceOperation(
      operation,
      blendedModel,
      manifest
    );

    return json({
      success: true,
      message: '🎯 Custom orchestration test completed',
      operation,
      result,
      health: await workflowOrchestrator.getServiceOrchestrationHealth(operation.serviceName)
    });

  } catch (error) {
    console.error('❌ Custom orchestration test failed:', error);
    
    return json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 