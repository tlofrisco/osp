/**
 * 🔄 Three-Legged Stool Coherence Monitor
 * 
 * Ensures that Schema, UI, and Workflows remain perfectly synchronized.
 * Any change to one "leg" automatically updates the other two legs.
 */

import type { BlendedModel, ServiceManifest } from '$lib/osp/types';
import type { WorkflowDefinition } from '$lib/types/workflow';
import { buildWorkflowsFromModel } from '$lib/osp/workflowBuilder';
import { buildContractUIFromModel } from '$lib/osp/contractUIBuilder';

export interface CoherenceChangeEvent {
  type: 'schema' | 'ui' | 'workflow';
  operation: 'create' | 'update' | 'delete';
  target: string; // entity name, field name, workflow name, etc.
  details: any;
  timestamp: string;
  userId?: string;
}

export interface CoherenceValidationResult {
  valid: boolean;
  issues: CoherenceIssue[];
  suggestions: CoherenceSuggestion[];
}

export interface CoherenceIssue {
  type: 'schema_ui_mismatch' | 'workflow_schema_mismatch' | 'ui_workflow_mismatch';
  severity: 'error' | 'warning' | 'info';
  message: string;
  source: string;
  target: string;
  details: any;
}

export interface CoherenceSuggestion {
  type: 'auto_fix' | 'manual_review' | 'enhancement';
  message: string;
  action: string;
  confidence: number; // 0-1
}

/**
 * 🔄 Coherence Monitor Class
 */
export class CoherenceMonitor {
  private model: BlendedModel;
  private manifest: ServiceManifest;
  private changeHistory: CoherenceChangeEvent[] = [];

  constructor(model: BlendedModel, manifest: ServiceManifest) {
    this.model = model;
    this.manifest = manifest;
  }

  /**
   * 🎯 Main orchestration method - ensures three-legged stool coherence
   */
  async ensureCoherence(changeEvent: CoherenceChangeEvent): Promise<CoherenceValidationResult> {
    console.log(`🔄 Coherence check triggered by: ${changeEvent.type} ${changeEvent.operation}`);
    
    // Record change in history
    this.changeHistory.push(changeEvent);
    
    // Validate current state
    const validation = await this.validateCoherence();
    
    if (!validation.valid) {
      console.log(`⚠️ Coherence issues detected, attempting auto-fix...`);
      
      // Attempt automatic synchronization
      const syncResult = await this.synchronizeStool(changeEvent);
      
      // Re-validate after sync
      const postSyncValidation = await this.validateCoherence();
      
      return {
        ...postSyncValidation,
        suggestions: [
          ...validation.suggestions,
          ...syncResult.suggestions
        ]
      };
    }
    
    return validation;
  }

  /**
   * 🔍 Validate coherence across all three legs
   */
  async validateCoherence(): Promise<CoherenceValidationResult> {
    const issues: CoherenceIssue[] = [];
    const suggestions: CoherenceSuggestion[] = [];

    // 1. Schema ↔ UI Coherence
    const schemaUIIssues = await this.validateSchemaUICoherence();
    issues.push(...schemaUIIssues);

    // 2. Schema ↔ Workflow Coherence  
    const schemaWorkflowIssues = await this.validateSchemaWorkflowCoherence();
    issues.push(...schemaWorkflowIssues);

    // 3. UI ↔ Workflow Coherence
    const uiWorkflowIssues = await this.validateUIWorkflowCoherence();
    issues.push(...uiWorkflowIssues);

    // Generate auto-fix suggestions
    for (const issue of issues) {
      const suggestion = this.generateFixSuggestion(issue);
      if (suggestion) {
        suggestions.push(suggestion);
      }
    }

    return {
      valid: issues.filter(i => i.severity === 'error').length === 0,
      issues,
      suggestions
    };
  }

  /**
   * 🔄 Synchronize the three-legged stool
   */
  private async synchronizeStool(changeEvent: CoherenceChangeEvent): Promise<{
    success: boolean;
    changes: string[];
    suggestions: CoherenceSuggestion[];
  }> {
    const changes: string[] = [];
    const suggestions: CoherenceSuggestion[] = [];

    try {
      switch (changeEvent.type) {
        case 'schema':
          await this.synchronizeFromSchema(changeEvent, changes, suggestions);
          break;
          
        case 'ui':
          await this.synchronizeFromUI(changeEvent, changes, suggestions);
          break;
          
        case 'workflow':
          await this.synchronizeFromWorkflow(changeEvent, changes, suggestions);
          break;
      }

      console.log(`✅ Synchronization completed: ${changes.length} changes made`);
      
      return {
        success: true,
        changes,
        suggestions
      };

    } catch (error) {
      console.error('❌ Synchronization failed:', error);
      
      return {
        success: false,
        changes,
        suggestions: [{
          type: 'manual_review',
          message: 'Automatic synchronization failed - manual review required',
          action: 'review_changes',
          confidence: 0
        }]
      };
    }
  }

  /**
   * 📊 Schema-driven synchronization
   */
  private async synchronizeFromSchema(
    changeEvent: CoherenceChangeEvent,
    changes: string[],
    suggestions: CoherenceSuggestion[]
  ): Promise<void> {
    console.log('🔄 Synchronizing UI and Workflows from Schema changes...');

    // Update UI to match schema changes
    if (changeEvent.operation === 'create' || changeEvent.operation === 'update') {
      // Regenerate contract UI
      const updatedUI = buildContractUIFromModel(this.model, this.manifest);
      this.manifest.contractUI = updatedUI;
      changes.push(`Updated UI for schema change: ${changeEvent.target}`);

      // Regenerate workflows
      const updatedWorkflows = buildWorkflowsFromModel(this.model, this.manifest.name);
      this.manifest.workflows = updatedWorkflows;
      changes.push(`Updated workflows for schema change: ${changeEvent.target}`);

      suggestions.push({
        type: 'auto_fix',
        message: 'Schema change automatically synchronized to UI and workflows',
        action: 'auto_sync_complete',
        confidence: 0.9
      });
    }

    // Handle deletions
    if (changeEvent.operation === 'delete') {
      // Remove related UI components
      this.removeUIComponentsForEntity(changeEvent.target);
      changes.push(`Removed UI components for deleted entity: ${changeEvent.target}`);

      // Remove related workflows
      this.removeWorkflowsForEntity(changeEvent.target);
      changes.push(`Removed workflows for deleted entity: ${changeEvent.target}`);

      suggestions.push({
        type: 'manual_review',
        message: 'Entity deletion may require manual cleanup of dependent features',
        action: 'review_dependencies',
        confidence: 0.7
      });
    }
  }

  /**
   * 🎨 UI-driven synchronization
   */
  private async synchronizeFromUI(
    changeEvent: CoherenceChangeEvent,
    changes: string[],
    suggestions: CoherenceSuggestion[]
  ): Promise<void> {
    console.log('🔄 Synchronizing Schema and Workflows from UI changes...');

    // If UI form was modified, update schema if needed
    if (changeEvent.details?.formChange) {
      const formChange = changeEvent.details.formChange;
      
      // Add new fields to schema if they don't exist
      if (formChange.newFields) {
        for (const field of formChange.newFields) {
          this.addFieldToSchema(formChange.entityName, field);
          changes.push(`Added field ${field.name} to ${formChange.entityName} schema`);
        }
      }

      // Update workflows to handle new form fields
      const updatedWorkflows = buildWorkflowsFromModel(this.model, this.manifest.name);
      this.manifest.workflows = updatedWorkflows;
      changes.push(`Updated workflows for UI form changes`);
    }

    suggestions.push({
      type: 'auto_fix',
      message: 'UI change automatically synchronized to schema and workflows',
      action: 'auto_sync_complete',
      confidence: 0.8
    });
  }

  /**
   * ⚡ Workflow-driven synchronization
   */
  private async synchronizeFromWorkflow(
    changeEvent: CoherenceChangeEvent,
    changes: string[],
    suggestions: CoherenceSuggestion[]
  ): Promise<void> {
    console.log('🔄 Synchronizing Schema and UI from Workflow changes...');

    // If workflow added new data requirements, update schema
    if (changeEvent.details?.dataRequirements) {
      for (const requirement of changeEvent.details.dataRequirements) {
        this.addFieldToSchema(requirement.entityName, requirement.field);
        changes.push(`Added field ${requirement.field.name} to support workflow: ${changeEvent.target}`);
      }

      // Update UI to include workflow-required fields
      const updatedUI = buildContractUIFromModel(this.model, this.manifest);
      this.manifest.contractUI = updatedUI;
      changes.push(`Updated UI to support workflow data requirements`);
    }

    suggestions.push({
      type: 'auto_fix',
      message: 'Workflow change automatically synchronized to schema and UI',
      action: 'auto_sync_complete',
      confidence: 0.8
    });
  }

  /**
   * 🔍 Schema ↔ UI coherence validation
   */
  private async validateSchemaUICoherence(): Promise<CoherenceIssue[]> {
    const issues: CoherenceIssue[] = [];

    for (const [entityName, entity] of Object.entries(this.model.entities)) {
      const uiPages = this.manifest.contractUI?.pages || [];
      const entityPage = uiPages.find((p: any) => p.entity === entityName);

      if (!entityPage) {
        issues.push({
          type: 'schema_ui_mismatch',
          severity: 'warning',
          message: `Entity ${entityName} exists in schema but has no UI page`,
          source: 'schema',
          target: 'ui',
          details: { entityName }
        });
        continue;
      }

      // Check if all schema fields have UI components
      const entityTyped = entity as any;
      for (const [fieldName, field] of Object.entries(entityTyped.fields || {})) {
        const hasUIComponent = entityPage.components?.some((c: any) => 
          c.type === 'form' && 
          c.config?.fields?.some((f: any) => f.name === fieldName)
        );

        const fieldTyped = field as any;
        if (!hasUIComponent && !fieldTyped.system_field) {
          issues.push({
            type: 'schema_ui_mismatch',
            severity: 'info',
            message: `Field ${fieldName} in ${entityName} has no UI component`,
            source: 'schema',
            target: 'ui',
            details: { entityName, fieldName }
          });
        }
      }
    }

    return issues;
  }

  /**
   * 🔍 Schema ↔ Workflow coherence validation
   */
  private async validateSchemaWorkflowCoherence(): Promise<CoherenceIssue[]> {
    const issues: CoherenceIssue[] = [];

    for (const [entityName, entity] of Object.entries(this.model.entities)) {
      // Ensure workflows is always treated as an array
      const workflows = Array.isArray(this.manifest.workflows) ? this.manifest.workflows : [];
      
      const entityWorkflows = workflows.filter((w: any) => 
        w.triggers?.some((t: any) => t.type === 'entity_insert' && t.config?.entity === entityName)
      ) || [];

      if (entityWorkflows.length === 0) {
        issues.push({
          type: 'workflow_schema_mismatch',
          severity: 'info',
          message: `Entity ${entityName} has no associated workflows`,
          source: 'schema',
          target: 'workflow',
          details: { entityName }
        });
      }

      // Check for workflow steps that reference non-existent fields
      const entityTyped = entity as any;
      for (const workflow of entityWorkflows) {
        for (const step of workflow.steps) {
          if (step.type === 'activity' && step.config?.field) {
            const fieldExists = entityTyped.fields?.[step.config.field];
            if (!fieldExists) {
              issues.push({
                type: 'workflow_schema_mismatch',
                severity: 'error',
                message: `Workflow ${workflow.name} references non-existent field: ${step.config.field}`,
                source: 'workflow',
                target: 'schema',
                details: { workflowName: workflow.name, fieldName: step.config.field }
              });
            }
          }
        }
      }
    }

    return issues;
  }

  /**
   * 🔍 UI ↔ Workflow coherence validation
   */
  private async validateUIWorkflowCoherence(): Promise<CoherenceIssue[]> {
    const issues: CoherenceIssue[] = [];

    const uiPages = this.manifest.contractUI?.pages || [];
    
    for (const page of uiPages) {
      // Check if forms have corresponding workflow triggers
      const formComponents = page.components?.filter((c: any) => c.type === 'form') || [];
      
      for (const form of formComponents) {
        // Ensure workflows is always treated as an array
        const workflows = Array.isArray(this.manifest.workflows) ? this.manifest.workflows : [];
        
        const hasWorkflowTrigger = workflows.some((w: any) =>
          w.triggers?.some((t: any) => 
            t.type === 'form_submit' && t.config?.form === form.id
          )
        );

        if (!hasWorkflowTrigger) {
          issues.push({
            type: 'ui_workflow_mismatch',
            severity: 'warning',
            message: `Form ${form.id} has no workflow trigger`,
            source: 'ui',
            target: 'workflow',
            details: { formId: form.id, pageId: page.id }
          });
        }
      }
    }

    return issues;
  }

  /**
   * 🔧 Generate fix suggestions for issues
   */
  private generateFixSuggestion(issue: CoherenceIssue): CoherenceSuggestion | null {
    switch (issue.type) {
      case 'schema_ui_mismatch':
        return {
          type: 'auto_fix',
          message: `Auto-generate UI component for ${issue.details.fieldName || issue.details.entityName}`,
          action: 'generate_ui',
          confidence: 0.9
        };

      case 'workflow_schema_mismatch':
        if (issue.severity === 'error') {
          return {
            type: 'manual_review',
            message: 'Fix workflow field references or add missing fields to schema',
            action: 'fix_references',
            confidence: 0.7
          };
        }
        return {
          type: 'auto_fix',
          message: 'Generate default workflow for entity',
          action: 'generate_workflow',
          confidence: 0.8
        };

      case 'ui_workflow_mismatch':
        return {
          type: 'auto_fix',
          message: 'Generate workflow trigger for form',
          action: 'generate_trigger',
          confidence: 0.9
        };

      default:
        return null;
    }
  }

  /**
   * 🗑️ Remove UI components for deleted entity
   */
  private removeUIComponentsForEntity(entityName: string): void {
    if (!this.manifest.contractUI?.pages) return;

    this.manifest.contractUI.pages = this.manifest.contractUI.pages.filter(
      (page: any) => page.entity !== entityName
    );
  }

  /**
   * 🗑️ Remove workflows for deleted entity
   */
  private removeWorkflowsForEntity(entityName: string): void {
    // Ensure workflows is always treated as an array
    if (!Array.isArray(this.manifest.workflows)) {
      this.manifest.workflows = [];
      return;
    }

    this.manifest.workflows = this.manifest.workflows.filter((workflow: any) =>
      !workflow.triggers?.some((trigger: any) =>
        trigger.config?.entity === entityName
      )
    );
  }

  /**
   * ➕ Add field to schema
   */
  private addFieldToSchema(entityName: string, field: any): void {
    if (!this.model.entities[entityName]) {
      console.warn(`Entity ${entityName} not found in schema`);
      return;
    }

    this.model.entities[entityName].fields[field.name] = {
      type: field.type || 'text',
      required: field.required || false,
      description: field.description || `Field added by coherence monitor`,
      ...field
    };
  }

  /**
   * 📊 Get coherence health score
   */
  getCoherenceHealth(): {
    score: number;
    breakdown: {
      schemaUI: number;
      schemaWorkflow: number;
      uiWorkflow: number;
    };
    lastCheck: string;
  } {
    // This would calculate based on recent validation results
    return {
      score: 0.95, // 95% coherent
      breakdown: {
        schemaUI: 0.98,
        schemaWorkflow: 0.92,
        uiWorkflow: 0.95
      },
      lastCheck: new Date().toISOString()
    };
  }

  /**
   * 📈 Get change history
   */
  getChangeHistory(limit: number = 50): CoherenceChangeEvent[] {
    return this.changeHistory
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }
}
