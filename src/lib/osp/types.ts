/**
 * 🏗️ OSP Core Types
 * 
 * Type definitions for the One Service Platform core architecture
 */

import type { WorkflowDefinition } from '$lib/types/workflow.js';

export interface BlendedModel {
  entities: Record<string, EntityDefinition>;
  relationships: RelationshipDefinition[];
  industryFrameworks: string[];
}

export interface EntityDefinition {
  name: string;
  fields: Record<string, FieldDefinition>;
  relationships: Record<string, RelationshipReference>;
}

export interface FieldDefinition {
  type: string;
  required: boolean;
  description?: string;
  system_field?: boolean;
  [key: string]: any;
}

export interface RelationshipReference {
  target: string;
  type: string;
  [key: string]: any;
}

export interface RelationshipDefinition {
  name: string;
  source: string;
  target: string;
  type: 'one_to_one' | 'one_to_many' | 'many_to_one' | 'many_to_many';
  description?: string;
}

export interface ServiceManifest {
  name: string;
  version: string;
  description: string;
  blendedModel: BlendedModel;
  contractUI: ContractUI;
  workflows?: WorkflowDefinition[];
  metadata?: {
    operationHistory?: OperationHistoryEntry[];
    [key: string]: any;
  };
}

export interface ContractUI {
  pages: UIPage[];
  navigation: NavigationItem[];
  [key: string]: any;
}

export interface UIPage {
  id: string;
  entity?: string;
  title: string;
  components?: UIComponent[];
  [key: string]: any;
}

export interface UIComponent {
  id: string;
  type: string;
  config?: {
    fields?: UIField[];
    [key: string]: any;
  };
  [key: string]: any;
}

export interface UIField {
  name: string;
  type: string;
  required: boolean;
  [key: string]: any;
}

export interface NavigationItem {
  id: string;
  label: string;
  path?: string;
  children?: NavigationItem[];
  [key: string]: any;
}

export interface OperationHistoryEntry {
  operation: string;
  target: string;
  timestamp: string;
  workflowsTriggered: string[];
  coherenceScore: number;
  userId?: string;
} 