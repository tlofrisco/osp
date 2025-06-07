<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { writable } from 'svelte/store';
  import { loadComponent, type ComponentConfig } from '$lib/components/ui';
  
  // Props
  export let contractUI: any;
  export let currentPath: string;
  export let serviceSchema: string;
  export let serviceName: string;
  export let currentRole: string = 'waitress'; // Default role
  
  // State
  let pageConfig: any = null;
  let loadedComponents = writable(new Map());
  let loading = true;
  let error = '';
  
  // Computed values for template
  $: availablePagePaths = contractUI?.pages?.map((p: any) => p.path) || [];
  
  // Reactive statements
  $: {
    if (contractUI?.pages && currentPath) {
      findAndLoadPage();
    }
  }
  
  async function findAndLoadPage() {
    loading = true;
    error = '';
    
    try {
      // Find the page configuration
      pageConfig = contractUI.pages?.find((p: any) => p.path === currentPath);
      
      if (!pageConfig) {
        error = `Page configuration not found for path: ${currentPath}`;
        loading = false;
        return;
      }
      
      console.log('🎯 Loading page:', pageConfig);
      console.log('🔍 Contract UI structure:', {
        hasPages: !!contractUI?.pages,
        hasComponents: !!contractUI?.components,
        hasEntities: !!contractUI?.entities,
        entitiesCount: contractUI?.entities?.length || 0,
        componentIds: contractUI?.components?.map((c: any) => c.id) || []
      });
      
      // Load all components for this page
      await loadPageComponents();
      
    } catch (err: any) {
      console.error('Error loading page:', err);
      error = err?.message || 'Failed to load page';
    } finally {
      loading = false;
    }
  }
  
  async function loadPageComponents() {
    if (!pageConfig?.components) return;
    
    const componentMap = new Map();
    
    // Load each component referenced by this page
    for (const componentId of pageConfig.components) {
      try {
        // Find the component configuration in the contract UI
        const componentConfig = contractUI.components?.find((c: any) => c.id === componentId);
        
        if (!componentConfig) {
          console.warn(`Component config not found for ID: ${componentId}`);
          continue;
        }
        
        console.log(`🔧 Loading component: ${componentId} (type: ${componentConfig.type})`);
        
        // Dynamically import the component
        const componentModule = await loadComponent(componentConfig.type);
        
        const component = {
          component: componentModule.default,
          config: componentConfig
        };
        
        // Create component-specific props based on component type and config
        const componentProps = createComponentProps(component.config, componentConfig.type);
        
        componentMap.set(componentId, {
          component: component.component,
          config: component.config,
          props: componentProps
        });
        
      } catch (err: any) {
        console.error(`Failed to load component ${componentId}:`, err);
        // Add error component as fallback
        const errorModule = await loadComponent('error_component');
        componentMap.set(componentId, {
          component: errorModule.default,
          config: { 
            id: componentId, 
            type: 'error_component',
            metadata: { error: err?.message || 'Unknown error' } 
          },
          props: {
            config: { 
              id: componentId, 
              type: 'error_component',
              metadata: { error: err?.message || 'Unknown error' } 
            },
            metadata: { error: err?.message || 'Unknown error' }
          }
        });
      }
    }
    
    // Update the store
    loadedComponents.set(componentMap);
    
    // Force Svelte to update
    await tick();
  }
  
  // Create component-specific props to avoid prop warnings
  function createComponentProps(config: any, componentType: string) {
    // Base props that all components get
    const baseProps = {
      config: config,
      metadata: config.metadata || {},
      serviceSchema: serviceSchema,
      serviceName: serviceName,
      currentRole: currentRole
    };
    
    // Component-specific props
    switch (componentType) {
      case 'service_info_card':
        return {
          ...baseProps
        };
        
      case 'stats_grid':
        return {
          ...baseProps,
          entities: contractUI?.entities || []
        };
        
      case 'activity_feed':
        return {
          ...baseProps
        };
        
      case 'workflow_status':
      case 'workflow_list':
      case 'workflow_triggers':
        return {
          ...baseProps
        };
        
      case 'dynamic_form':
        return {
          ...baseProps,
          entityName: config.entity || '',
          fields: config.fields || [],
          actions: config.actions || []
        };
        
      case 'data_table':
        return {
          ...baseProps,
          entityName: config.entity || '',
          columns: config.columns || [],
          actions: config.actions || []
        };
        
      case 'filter_panel':
        return {
          ...baseProps,
          entityName: config.entity || '',
          fields: config.fields || []
        };
        
      default:
        // For unknown component types, provide all props
        return {
          ...baseProps,
          entityName: config.entity || '',
          entities: contractUI?.entities || [],
          theme: contractUI?.theme || {},
          globalSettings: contractUI?.global_settings || {},
          columns: config.columns || [],
          fields: config.fields || [],
          actions: config.actions || [],
          currentRole: currentRole
        };
    }
  }
  
  onMount(() => {
    console.log('🚀 DynamicPageRenderer mounted');
    console.log('Contract UI:', contractUI);
    console.log('Current path:', currentPath);
  });
</script>

<div class="dynamic-page-container" data-path={currentPath}>
  {#if loading}
    <div class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading dynamic UI...</p>
    </div>
  {:else if error}
    <div class="error-state">
      <h3>❌ Error Loading Page</h3>
      <p>{error}</p>
      <details>
        <summary>Debug Info</summary>
        <div class="debug-info">
          <div><strong>Current Path:</strong> {currentPath}</div>
          <div><strong>Service Schema:</strong> {serviceSchema}</div>
          <div><strong>Available Pages:</strong> {JSON.stringify(availablePagePaths)}</div>
        </div>
      </details>
    </div>
  {:else if pageConfig}
    <div class="page-content" data-layout={pageConfig.layout}>
      <!-- Dynamic Components -->
      <main class="components-container">
        {#each pageConfig.components as componentId (componentId)}
          {#if $loadedComponents.has(componentId)}
            {@const componentData = $loadedComponents.get(componentId)}
            <div 
              class="component-wrapper" 
              data-component-id={componentId}
              data-component-type={componentData.config.type}
              data-layout={componentData.config.layout || 'default'}
            >
              <svelte:component
                this={componentData.component}
                {...componentData.props}
              />
            </div>
          {:else}
            <div class="component-placeholder">
              <p>Loading component: {componentId}...</p>
            </div>
          {/if}
        {/each}
      </main>
    </div>
  {:else}
    <div class="no-config-state">
      <h3>🚧 No Page Configuration</h3>
      <p>No page configuration found for path: <code>{currentPath}</code></p>
    </div>
  {/if}
</div>

<style>
  .dynamic-page-container {
    min-height: 100%;
    background: var(--bg-primary, #f8fafc);
    display: flex;
    flex-direction: column;
  }
  
  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 400px;
    gap: 1rem;
  }
  
  .loading-spinner {
    width: 32px;
    height: 32px;
    border: 3px solid var(--border-light, #e2e8f0);
    border-top: 3px solid var(--primary-color, #3b82f6);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .error-state {
    padding: 2rem;
    background: var(--error-color, #fef2f2);
    border: 1px solid var(--error-color, #fecaca);
    border-radius: var(--border-radius, 8px);
    color: var(--error-color, #dc2626);
    margin: 1rem;
  }
  
  .no-config-state {
    padding: 2rem;
    background: var(--warning-color, #fffbeb);
    border: 1px solid var(--warning-color, #fde68a);
    border-radius: var(--border-radius, 8px);
    color: var(--warning-color, #d97706);
    margin: 1rem;
  }
  
  .page-content {
    display: flex;
    flex-direction: column;
    flex: 1;
    height: 100%;
  }
  
  .components-container {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg, 24px);
    flex: 1;
    height: 100%;
    overflow-y: auto;
  }
  
  /* Layout-specific styling */
  .page-content[data-layout="dashboard"] .components-container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: var(--spacing-lg, 24px);
    align-items: start;
  }
  
  .page-content[data-layout="entity_manager"] .components-container {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xl, 32px);
  }
  
  .component-wrapper {
    background: var(--card-bg, white);
    border-radius: var(--border-radius, 8px);
    box-shadow: var(--shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.1));
    overflow: hidden;
    transition: box-shadow 0.2s ease-in-out;
  }
  
  .component-wrapper:hover {
    box-shadow: var(--shadow-md, 0 4px 6px rgba(0, 0, 0, 0.1));
  }
  
  .component-wrapper[data-layout="full_width"] {
    grid-column: 1 / -1;
  }
  
  .component-wrapper[data-layout="vertical"] {
    display: flex;
    flex-direction: column;
  }
  
  .component-wrapper[data-layout="horizontal"] {
    display: flex;
    flex-direction: row;
    align-items: center;
  }
  
  .component-placeholder {
    padding: 2rem;
    background: var(--bg-secondary, #f3f4f6);
    border: 2px dashed var(--border-color, #d1d5db);
    border-radius: var(--border-radius, 8px);
    text-align: center;
    color: var(--text-muted, #6b7280);
  }
  
  /* Responsive design */
  @media (max-width: 768px) {
    .page-content[data-layout="dashboard"] .components-container {
      grid-template-columns: 1fr;
    }
    
    .components-container {
      gap: var(--spacing-md, 16px);
    }
  }
  
  /* Debug styling */
  details {
    margin-top: 1rem;
  }
  
  .debug-info {
    background: var(--bg-secondary, #f9fafb);
    padding: 1rem;
    border-radius: var(--border-radius, 4px);
    border: 1px solid var(--border-color, #e5e7eb);
    font-family: monospace;
    font-size: 0.875rem;
  }
  
  .debug-info div {
    margin-bottom: 0.5rem;
  }
  
  .debug-info div:last-child {
    margin-bottom: 0;
  }
</style> 