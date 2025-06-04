/**
 * 🎭 Workflow Orchestrator
 * 
 * Orchestrates workflow execution and maintains three-legged stool coherence
 * across all OSP service operations.
 */

import type { BlendedModel, ServiceManifest } from '$lib/osp/types.js';
import type { WorkflowDefinition, WorkflowTrigger } from '$lib/types/workflow.js';
import { WorkflowInterpreter, type WorkflowExecutionOptions, type WorkflowExecutionResult } from './workflowInterpreter.js';
import { CoherenceMonitor, type CoherenceChangeEvent, type CoherenceValidationResult } from './coherenceMonitor.js';
import { TemporalClient } from '$lib/temporal/client.js';

export interface ServiceOperation {
  type: 'create' | 'update' | 'delete';
  target: 'service' | 'entity' | 'field' | 'workflow' | 'ui_component';
  serviceName: string;
  details: any;
  userId?: string;
  context?: Record<string, any>;
}

export interface OrchestrationResult {
  success: boolean;
  serviceOperation: ServiceOperation;
  workflowsTriggered: string[];
  coherenceResult: CoherenceValidationResult;
  errors: string[];
  warnings: string[];
}

/**
 * 🎭 Workflow Orchestrator Class
 */
export class WorkflowOrchestrator {
  private temporal: TemporalClient;
  private interpreters: Map<string, WorkflowInterpreter> = new Map();
  private coherenceMonitors: Map<string, CoherenceMonitor> = new Map();

  constructor() {
    this.temporal = new TemporalClient();
  }

  /**
   * 🚀 Orchestrate service operation with workflow execution and coherence monitoring
   */
  async orchestrateServiceOperation(
    operation: ServiceOperation,
    model: BlendedModel,
    manifest: ServiceManifest
  ): Promise<OrchestrationResult> {
    console.log(`🎭 Orchestrating ${operation.type} operation on ${operation.target}`);

    const result: OrchestrationResult = {
      success: true,
      serviceOperation: operation,
      workflowsTriggered: [],
      coherenceResult: { valid: true, issues: [], suggestions: [] },
      errors: [],
      warnings: []
    };

    try {
      // 1. Setup/update interpreters and monitors
      this.setupServiceComponents(operation.serviceName, model, manifest);

      // 2. Trigger coherence monitoring for the change
      const coherenceEvent: CoherenceChangeEvent = {
        type: this.mapOperationToCoherenceType(operation),
        operation: operation.type,
        target: operation.details?.name || operation.target,
        details: operation.details,
        timestamp: new Date().toISOString(),
        userId: operation.userId
      };

      const coherenceMonitor = this.coherenceMonitors.get(operation.serviceName);
      if (coherenceMonitor) {
        result.coherenceResult = await coherenceMonitor.ensureCoherence(coherenceEvent);
        
        if (!result.coherenceResult.valid) {
          const errorIssues = result.coherenceResult.issues.filter(i => i.severity === 'error');
          if (errorIssues.length > 0) {
            result.errors.push(...errorIssues.map(i => i.message));
          }
          
          const warningIssues = result.coherenceResult.issues.filter(i => i.severity === 'warning');
          if (warningIssues.length > 0) {
            result.warnings.push(...warningIssues.map(i => i.message));
          }
        }
      }

      // 3. Find and execute triggered workflows
      const triggeredWorkflows = this.findTriggeredWorkflows(operation, manifest);
      
      for (const workflowDef of triggeredWorkflows) {
        try {
          const executionResult = await this.executeWorkflow(
            operation.serviceName,
            workflowDef,
            {
              input: {
                operation,
                ...operation.context
              },
              workflowId: `${operation.serviceName}-${workflowDef.name}-${Date.now()}`
            }
          );

          if (executionResult.success) {
            result.workflowsTriggered.push(workflowDef.name);
            console.log(`✅ Workflow executed: ${workflowDef.name}`);
          } else {
            result.errors.push(`Workflow ${workflowDef.name} failed: ${executionResult.error}`);
            console.error(`❌ Workflow failed: ${workflowDef.name}`, executionResult.error);
          }
        } catch (error) {
          result.errors.push(`Workflow execution error: ${error}`);
          console.error(`❌ Workflow execution error:`, error);
        }
      }

      // 4. Handle post-operation workflow scheduling
      await this.schedulePostOperationWorkflows(operation, manifest, result);

      // 5. Update service state
      await this.updateServiceState(operation, manifest, result);

      result.success = result.errors.length === 0;

    } catch (error) {
      console.error('❌ Orchestration failed:', error);
      result.success = false;
      result.errors.push(`Orchestration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  /**
   * ⚡ Execute a specific workflow
   */
  async executeWorkflow(
    serviceName: string,
    workflowDef: WorkflowDefinition,
    options: WorkflowExecutionOptions = {}
  ): Promise<WorkflowExecutionResult> {
    const interpreter = this.interpreters.get(serviceName);
    
    if (!interpreter) {
      throw new Error(`No workflow interpreter found for service: ${serviceName}`);
    }

    console.log(`⚡ Executing workflow: ${workflowDef.name} for service: ${serviceName}`);
    
    return await interpreter.executeWorkflow(workflowDef, options);
  }

  /**
   * 🎯 Trigger workflows manually
   */
  async triggerWorkflow(
    serviceName: string,
    workflowName: string,
    input: Record<string, any> = {},
    userId?: string
  ): Promise<WorkflowExecutionResult> {
    const interpreter = this.interpreters.get(serviceName);
    
    if (!interpreter) {
      throw new Error(`No workflow interpreter found for service: ${serviceName}`);
    }

    // Find workflow definition
    const manifest = await this.getServiceManifest(serviceName);
    const workflowDef = manifest.workflows?.find(w => w.name === workflowName);
    
    if (!workflowDef) {
      throw new Error(`Workflow not found: ${workflowName}`);
    }

    return await interpreter.executeWorkflow(workflowDef, {
      input: { ...input, userId },
      workflowId: `manual-${workflowName}-${Date.now()}`
    });
  }

  /**
   * 📊 Get workflow execution status
   */
  async getWorkflowStatus(serviceName: string, workflowId: string): Promise<any> {
    const interpreter = this.interpreters.get(serviceName);
    
    if (!interpreter) {
      throw new Error(`No workflow interpreter found for service: ${serviceName}`);
    }

    return await interpreter.getWorkflowStatus(workflowId);
  }

  /**
   * 🔍 Find workflows triggered by operation
   */
  private findTriggeredWorkflows(
    operation: ServiceOperation,
    manifest: ServiceManifest
  ): WorkflowDefinition[] {
    if (!manifest.workflows) return [];

    const triggeredWorkflows: WorkflowDefinition[] = [];

    for (const workflow of manifest.workflows) {
      for (const trigger of workflow.triggers || []) {
        if (this.doesTriggerMatch(trigger, operation)) {
          triggeredWorkflows.push(workflow);
          break; // Only trigger each workflow once per operation
        }
      }
    }

    return triggeredWorkflows;
  }

  /**
   * 🎯 Check if trigger matches operation
   */
  private doesTriggerMatch(trigger: WorkflowTrigger, operation: ServiceOperation): boolean {
    switch (trigger.type) {
      case 'entity_insert':
        return operation.type === 'create' && 
               operation.target === 'entity' &&
               trigger.config?.entity === operation.details?.name;

      case 'entity_update':
        return operation.type === 'update' && 
               operation.target === 'entity' &&
               trigger.config?.entity === operation.details?.name;

      case 'entity_delete':
        return operation.type === 'delete' && 
               operation.target === 'entity' &&
               trigger.config?.entity === operation.details?.name;

      case 'form_submit':
        return operation.type === 'create' && 
               operation.target === 'entity' &&
               trigger.config?.form === operation.details?.formId;

      case 'service_create':
        return operation.type === 'create' && operation.target === 'service';

      case 'service_update':
        return operation.type === 'update' && operation.target === 'service';

      case 'manual':
        // Manual triggers don't auto-trigger from operations
        return false;

      case 'schedule':
        // Scheduled workflows handled separately
        return false;

      default:
        return false;
    }
  }

  /**
   * 🔧 Setup service components
   */
  private setupServiceComponents(
    serviceName: string,
    model: BlendedModel,
    manifest: ServiceManifest
  ): void {
    // Setup workflow interpreter
    if (!this.interpreters.has(serviceName)) {
      this.interpreters.set(serviceName, new WorkflowInterpreter(model));
    }

    // Setup coherence monitor
    if (!this.coherenceMonitors.has(serviceName)) {
      this.coherenceMonitors.set(serviceName, new CoherenceMonitor(model, manifest));
    }
  }

  /**
   * 🗂️ Map operation to coherence type
   */
  private mapOperationToCoherenceType(operation: ServiceOperation): 'schema' | 'ui' | 'workflow' {
    switch (operation.target) {
      case 'entity':
      case 'field':
        return 'schema';
      case 'ui_component':
        return 'ui';
      case 'workflow':
        return 'workflow';
      default:
        return 'schema'; // Default to schema changes
    }
  }

  /**
   * ⏰ Schedule post-operation workflows
   */
  private async schedulePostOperationWorkflows(
    operation: ServiceOperation,
    manifest: ServiceManifest,
    result: OrchestrationResult
  ): Promise<void> {
    // Find workflows with schedule triggers that should run after operations
    const scheduledWorkflows = manifest.workflows?.filter(w =>
      w.triggers?.some(t => 
        t.type === 'schedule' && 
        t.config?.runAfterOperations?.includes(operation.type)
      )
    ) || [];

    for (const workflow of scheduledWorkflows) {
      try {
        // Schedule with Temporal (in full implementation)
        console.log(`⏰ Scheduling workflow: ${workflow.name}`);
        
        // For now, just log - in full Temporal implementation, this would create scheduled workflows
        result.workflowsTriggered.push(`${workflow.name} (scheduled)`);
        
      } catch (error) {
        result.warnings.push(`Failed to schedule workflow: ${workflow.name}`);
      }
    }
  }

  /**
   * 💾 Update service state
   */
  private async updateServiceState(
    operation: ServiceOperation,
    manifest: ServiceManifest,
    result: OrchestrationResult
  ): Promise<void> {
    // Update service manifest with operation results
    // In full implementation, this would persist to database
    
    if (!manifest.metadata) {
      manifest.metadata = {};
    }

    if (!manifest.metadata.operationHistory) {
      manifest.metadata.operationHistory = [];
    }

    manifest.metadata.operationHistory.push({
      operation: operation.type,
      target: operation.target,
      timestamp: new Date().toISOString(),
      workflowsTriggered: result.workflowsTriggered,
      coherenceScore: result.coherenceResult.valid ? 1.0 : 0.8,
      userId: operation.userId
    });

    // Keep only last 100 operations
    if (manifest.metadata.operationHistory.length > 100) {
      manifest.metadata.operationHistory = manifest.metadata.operationHistory.slice(-100);
    }
  }

  /**
   * 📋 Get service manifest (placeholder)
   */
  private async getServiceManifest(serviceName: string): Promise<ServiceManifest> {
    // In full implementation, this would fetch from database
    // For now, return empty manifest
    return {
      name: serviceName,
      version: '1.0.0',
      description: `Service: ${serviceName}`,
      blendedModel: { entities: {}, relationships: [], industryFrameworks: [] },
      contractUI: { pages: [], navigation: [] },
      workflows: []
    };
  }

  /**
   * 📊 Get orchestration health for service
   */
  async getServiceOrchestrationHealth(serviceName: string): Promise<{
    coherenceScore: number;
    activeWorkflows: number;
    recentOperations: number;
    lastOperation: string;
  }> {
    const coherenceMonitor = this.coherenceMonitors.get(serviceName);
    const coherenceHealth = coherenceMonitor?.getCoherenceHealth();

    return {
      coherenceScore: coherenceHealth?.score || 0,
      activeWorkflows: 0, // Would query Temporal for active workflows
      recentOperations: coherenceMonitor?.getChangeHistory(10).length || 0,
      lastOperation: coherenceMonitor?.getChangeHistory(1)[0]?.timestamp || 'never'
    };
  }

  /**
   * 🧹 Cleanup service components
   */
  cleanupService(serviceName: string): void {
    this.interpreters.delete(serviceName);
    this.coherenceMonitors.delete(serviceName);
    console.log(`🧹 Cleaned up orchestrator components for service: ${serviceName}`);
  }

  /**
   * 📋 List all managed services
   */
  getManagedServices(): string[] {
    return Array.from(this.interpreters.keys());
  }
}

/**
 * 🎭 Singleton instance for application-wide use
 */
export const workflowOrchestrator = new WorkflowOrchestrator(); 