<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { writable } from 'svelte/store';
  import { loadComponent, type ComponentConfig } from '$lib/components/ui';
  
  // Props
  export let contractUI: any;
  export let currentPath: string;
  export let serviceSchema: string;
  export let serviceName: string;
  
  // State
  let pageConfig: any = null;
  let loadedComponents = writable(new Map());
  let loading = true;
  let error = '';
  
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
        
        // Add common props for all components
        const componentProps = {
          config: component.config,
          metadata: component.config.metadata || {},
          serviceSchema: serviceSchema,
          entityName: component.config.entity || '',
          entities: contractUI?.entities || [], // Pass entities for StatsGrid
          // Legacy props for backward compatibility
          columns: component.config.columns || [],
          fields: component.config.fields || [],
          actions: component.config.actions || []
        };
        
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
            metadata: { error: (err as any)?.message || 'Unknown error' } 
          },
          props: {
            config: { 
              id: componentId, 
              type: 'error_component',
              metadata: { error: (err as any)?.message || 'Unknown error' } 
            },
            metadata: { error: (err as any)?.message || 'Unknown error' },
            serviceSchema: serviceSchema,
            entityName: '',
            entities: [],
            columns: [],
            fields: [],
            actions: []
          }
        });
      }
    }
    
    // Update the store
    loadedComponents.set(componentMap);
    
    // Force Svelte to update
    await tick();
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
        <pre>Current Path: {currentPath}
Service Schema: {serviceSchema}
Available Pages: {JSON.stringify(contractUI?.pages?.map(p => p.path) || [], null, 2)}</pre>
      </details>
    </div>
  {:else if pageConfig}
    <div class="page-content" data-layout={pageConfig.layout}>
      <!-- Page Header -->
      <header class="page-header">
        <h1>{pageConfig.title || pageConfig.path}</h1>
        {#if pageConfig.description}
          <p class="page-description">{pageConfig.description}</p>
        {/if}
      </header>
      
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
                config={componentData.config}
                metadata={componentData.config.metadata || {}}
                serviceSchema={serviceSchema}
                entityName={componentData.config.entity || ''}
                entities={contractUI?.entities || []}
                columns={componentData.config.columns || []}
                fields={componentData.config.fields || []}
                actions={componentData.config.actions || []}
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
    background: #f8fafc;
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
    border: 3px solid #e2e8f0;
    border-top: 3px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .error-state {
    padding: 2rem;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 8px;
    color: #dc2626;
    margin: 1rem;
  }
  
  .no-config-state {
    padding: 2rem;
    background: #fffbeb;
    border: 1px solid #fde68a;
    border-radius: 8px;
    color: #d97706;
    margin: 1rem;
  }
  
  .page-content {
    padding: 1rem;
  }
  
  .page-header {
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #e2e8f0;
  }
  
  .page-header h1 {
    font-size: 2rem;
    font-weight: 700;
    color: #1f2937;
    margin: 0 0 0.5rem 0;
  }
  
  .page-description {
    color: #6b7280;
    margin: 0;
    font-size: 1.1rem;
  }
  
  .components-container {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
  
  /* Layout-specific styling */
  .page-content[data-layout="dashboard"] .components-container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
  }
  
  .page-content[data-layout="entity_manager"] .components-container {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }
  
  .component-wrapper {
    background: white;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    transition: box-shadow 0.2s ease-in-out;
  }
  
  .component-wrapper:hover {
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
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
    background: #f3f4f6;
    border: 2px dashed #d1d5db;
    border-radius: 8px;
    text-align: center;
    color: #6b7280;
  }
  
  /* Responsive design */
  @media (max-width: 768px) {
    .page-content[data-layout="dashboard"] .components-container {
      grid-template-columns: 1fr;
    }
    
    .page-header h1 {
      font-size: 1.5rem;
    }
    
    .page-content {
      padding: 0.5rem;
    }
  }
  
  /* Debug styling */
  details {
    margin-top: 1rem;
  }
  
  details pre {
    background: #f9fafb;
    padding: 1rem;
    border-radius: 4px;
    border: 1px solid #e5e7eb;
    overflow-x: auto;
    font-size: 0.875rem;
  }
</style> 