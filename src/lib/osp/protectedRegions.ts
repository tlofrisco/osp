/**
 * Protected Regions Management
 * 
 * This module provides utilities for managing protected regions in service configurations,
 * allowing manual customizations to be preserved during regeneration.
 */

export interface ProtectedRegion {
  id: string;
  type: 'ui' | 'workflow' | 'schema' | 'custom';
  path: string;
  content: any;
  metadata?: {
    createdAt: string;
    updatedAt: string;
    createdBy?: string;
    description?: string;
  };
}

export interface ServiceProtectedRegions {
  ui: {
    generated: Record<string, any>;
    custom: Record<string, any>;
  };
  workflows: {
    generated: Record<string, any>;
    custom: Record<string, any>;
  };
  schema: {
    generated: Record<string, any>;
    custom: Record<string, any>;
  };
}

/**
 * Extract protected regions from a service configuration
 */
export function extractProtectedRegions(config: any): ServiceProtectedRegions {
  const regions: ServiceProtectedRegions = {
    ui: { generated: {}, custom: {} },
    workflows: { generated: {}, custom: {} },
    schema: { generated: {}, custom: {} }
  };

  // Extract UI protected regions
  if (config.contract_ui?.pages) {
    config.contract_ui.pages.forEach((page: any) => {
      if (page._protected) {
        regions.ui.custom[page.id] = page;
      } else {
        regions.ui.generated[page.id] = page;
      }
    });
  }

  // Extract workflow protected regions
  if (config.workflows) {
    config.workflows.forEach((workflow: any) => {
      if (workflow._protected) {
        regions.workflows.custom[workflow.id] = workflow;
      } else {
        regions.workflows.generated[workflow.id] = workflow;
      }
    });
  }

  return regions;
}

/**
 * Mark a component as protected
 */
export function markAsProtected(component: any, metadata?: any): any {
  return {
    ...component,
    _protected: true,
    _protectedMetadata: {
      ...metadata,
      protectedAt: new Date().toISOString()
    }
  };
}

/**
 * Merge regenerated content with protected regions
 */
export function mergeWithProtected(
  regenerated: any,
  protectedRegions: ServiceProtectedRegions,
  dimension: 'ui' | 'workflows' | 'schema'
): any {
  if (dimension === 'ui') {
    // Merge UI components
    const mergedPages = [...Object.values(regenerated.pages || {})];
    
    // Add back custom pages
    Object.values(protectedRegions.ui.custom).forEach((customPage: any) => {
      const existingIndex = mergedPages.findIndex((p: any) => p.id === customPage.id);
      if (existingIndex >= 0) {
        // Custom page overrides generated one
        mergedPages[existingIndex] = customPage;
      } else {
        // Add custom page
        mergedPages.push(customPage);
      }
    });

    return {
      ...regenerated,
      pages: mergedPages
    };
  }

  if (dimension === 'workflows') {
    // Merge workflows
    const mergedWorkflows = [...(regenerated.workflows || regenerated || [])];
    
    // Add back custom workflows
    Object.values(protectedRegions.workflows.custom).forEach((customWorkflow: any) => {
      const existingIndex = mergedWorkflows.findIndex((w: any) => w.id === customWorkflow.id);
      if (existingIndex >= 0) {
        // Custom workflow overrides generated one
        mergedWorkflows[existingIndex] = customWorkflow;
      } else {
        // Add custom workflow
        mergedWorkflows.push(customWorkflow);
      }
    });

    return mergedWorkflows;
  }

  return regenerated;
}

/**
 * Create a protected region marker for JSON/YAML configs
 */
export function createProtectedMarker(content: any, id: string): any {
  return {
    '// PROTECTED_START': id,
    ...content,
    '// PROTECTED_END': id
  };
}

/**
 * Parse protected regions from a config string
 */
export function parseProtectedRegions(configString: string): Map<string, string> {
  const regions = new Map<string, string>();
  const regex = /\/\/ PROTECTED_START: (\w+)([\s\S]*?)\/\/ PROTECTED_END: \1/g;
  
  let match;
  while ((match = regex.exec(configString)) !== null) {
    regions.set(match[1], match[2].trim());
  }
  
  return regions;
}

/**
 * Apply protected regions to a config object
 */
export function applyProtectedRegions(
  config: any,
  regions: Map<string, any>
): any {
  const result = { ...config };
  
  regions.forEach((content, id) => {
    // Find and replace the region in the config
    const path = id.split('.');
    let current = result;
    
    for (let i = 0; i < path.length - 1; i++) {
      if (!current[path[i]]) {
        current[path[i]] = {};
      }
      current = current[path[i]];
    }
    
    current[path[path.length - 1]] = content;
  });
  
  return result;
}

/**
 * Generate a diff between original and modified configs to identify customizations
 */
export function identifyCustomizations(
  original: any,
  modified: any,
  path: string[] = []
): ProtectedRegion[] {
  const customizations: ProtectedRegion[] = [];
  
  // Compare objects recursively
  if (typeof original === 'object' && typeof modified === 'object') {
    // Check for added properties
    Object.keys(modified).forEach(key => {
      const currentPath = [...path, key];
      
      if (!(key in original)) {
        // This is a custom addition
        customizations.push({
          id: currentPath.join('.'),
          type: 'custom',
          path: currentPath.join('.'),
          content: modified[key],
          metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            description: 'Custom addition'
          }
        });
      } else if (JSON.stringify(original[key]) !== JSON.stringify(modified[key])) {
        // Recurse for nested changes
        customizations.push(...identifyCustomizations(original[key], modified[key], currentPath));
      }
    });
  } else if (original !== modified) {
    // Value has been customized
    customizations.push({
      id: path.join('.'),
      type: 'custom',
      path: path.join('.'),
      content: modified,
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        description: 'Custom modification'
      }
    });
  }
  
  return customizations;
} 