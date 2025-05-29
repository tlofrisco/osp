<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import DynamicPageRenderer from '$lib/components/DynamicPageRenderer.svelte';
  
  /** @type {import('./$types').PageData} */
  export let data;

  // Extract data and get contract UI
  const { serviceName, service, tables } = data;
  const serviceSchema = service?.service_schema;
  const contractUI = service?.contract_ui;
  
  console.log('🎯 Service Page Data:', {
    serviceName,
    serviceSchema,
    contractUI: !!contractUI,
    service: !!service
  });
  
  // Navigation state
  let currentPath = '/dashboard'; // Default to dashboard
  let sidebarOpen = true;
  
  // Page data
  let availablePages: any[] = [];
  let navigationItems: any[] = [];
  
  // Initialize from contract UI
  $: {
    if (contractUI?.pages) {
      availablePages = contractUI.pages;
      navigationItems = contractUI.navigation?.items || [];
      console.log('🚀 Contract UI loaded:', {
        pages: availablePages.length,
        navigation: navigationItems.length,
        currentPath
      });
    }
  }
  
  function navigateToPage(path: string) {
    currentPath = path;
    console.log('🧭 Navigating to:', path);
  }
  
  function toggleSidebar() {
    sidebarOpen = !sidebarOpen;
  }
  
  onMount(() => {
    console.log('🚀 Service Page mounted for:', serviceName);
    console.log('Contract UI available:', !!contractUI);
    console.log('Available pages:', contractUI?.pages?.length || 0);
  });
</script>

<div class="service-app" class:sidebar-collapsed={!sidebarOpen}>
  <!-- Sidebar Navigation -->
  <aside class="sidebar" class:collapsed={!sidebarOpen}>
    <div class="sidebar-header">
      <div class="service-info">
        <h2 class="service-title">{serviceName}</h2>
        <p class="service-schema">{serviceSchema}</p>
      </div>
      <button class="sidebar-toggle" on:click={toggleSidebar}>
        {sidebarOpen ? '←' : '→'}
      </button>
    </div>
    
    <nav class="sidebar-nav">
      {#if navigationItems.length > 0}
        {#each navigationItems as navItem (navItem.path)}
          <button 
            class="nav-item"
            class:active={currentPath === navItem.path}
            on:click={() => navigateToPage(navItem.path)}
          >
            {#if navItem.icon}
              <span class="nav-icon">{navItem.icon === 'dashboard' ? '📈' : navItem.icon === 'person' ? '👤' : navItem.icon === 'inventory' ? '📦' : navItem.icon === 'shopping_cart' ? '🛒' : '📋'}</span>
            {/if}
            {#if sidebarOpen}
              <span class="nav-label">{navItem.label}</span>
            {/if}
          </button>
        {/each}
      {:else}
        <!-- Fallback navigation if no contract UI -->
        <button 
          class="nav-item"
          class:active={currentPath === '/dashboard'}
          on:click={() => navigateToPage('/dashboard')}
        >
          <span class="nav-icon">📈</span>
          {#if sidebarOpen}
            <span class="nav-label">Dashboard</span>
          {/if}
        </button>
        
        {#if service?.blended_model?.entities}
          {#each service.blended_model.entities as entity (entity.name)}
            <button 
              class="nav-item"
              class:active={currentPath === `/${entity.name.toLowerCase()}`}
              on:click={() => navigateToPage(`/${entity.name.toLowerCase()}`)}
            >
              <span class="nav-icon">📋</span>
              {#if sidebarOpen}
                <span class="nav-label">{entity.name.replace(/_/g, ' ')}</span>
              {/if}
            </button>
          {/each}
        {/if}
      {/if}
    </nav>
    
    <div class="sidebar-footer">
      {#if sidebarOpen}
        <div class="service-stats">
          <div class="stat">
            <span class="stat-label">Pages:</span>
            <span class="stat-value">{availablePages.length}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Schema:</span>
            <span class="stat-value">{serviceSchema?.slice(-6) || 'N/A'}</span>
          </div>
        </div>
      {/if}
    </div>
  </aside>

  <!-- Main Content Area -->
  <main class="main-content">
    {#if contractUI && contractUI.pages?.length > 0}
      <!-- Dynamic Contract UI Rendering -->
      <DynamicPageRenderer 
        {contractUI}
        {currentPath}
        {serviceSchema}
        {serviceName}
      />
    {:else}
      <!-- Fallback UI for services without contract UI -->
      <div class="fallback-ui">
        <header class="page-header">
          <h1>Service: {serviceName}</h1>
          <p>This service doesn't have a dynamic UI configured yet.</p>
        </header>
        
        <div class="fallback-content">
          <div class="info-section">
            <h3>Service Information</h3>
            <div class="info-grid">
              <div><strong>Name:</strong> {serviceName}</div>
              <div><strong>Schema:</strong> {serviceSchema}</div>
              <div><strong>Tables:</strong> {tables?.length || 0}</div>
            </div>
          </div>
          
          {#if service?.blended_model?.entities}
            <div class="entities-section">
              <h3>Available Entities</h3>
              <div class="entities-grid">
                {#each service.blended_model.entities as entity (entity.name)}
                  <div class="entity-card">
                    <h4>{entity.name}</h4>
                    <p>{Object.keys(entity.attributes || {}).length} fields</p>
                    <button on:click={() => navigateToPage(`/${entity.name.toLowerCase()}`)}>
                      Manage →
                    </button>
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        </div>
      </div>
    {/if}
  </main>
</div>

<style>
  .service-app {
    display: flex;
    min-height: 100vh;
    background: #f8fafc;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
  
  .sidebar {
    width: 280px;
    background: white;
    border-right: 1px solid #e5e7eb;
    display: flex;
    flex-direction: column;
    transition: width 0.3s ease;
    position: fixed;
    height: 100vh;
    z-index: 10;
  }
  
  .sidebar.collapsed {
    width: 60px;
  }
  
  .sidebar-header {
    padding: 1rem;
    border-bottom: 1px solid #e5e7eb;
    display: flex;
    justify-content: space-between;
    align-items: center;
    min-height: 80px;
  }
  
  .service-info {
    flex: 1;
    overflow: hidden;
  }
  
  .service-title {
    font-size: 1.125rem;
    font-weight: 700;
    color: #1f2937;
    margin: 0 0 0.25rem 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .service-schema {
    font-size: 0.75rem;
    color: #6b7280;
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .sidebar-toggle {
    background: #f3f4f6;
    border: 1px solid #e5e7eb;
    border-radius: 4px;
    padding: 0.25rem 0.5rem;
    cursor: pointer;
    font-size: 0.875rem;
    color: #6b7280;
    transition: all 0.2s;
  }
  
  .sidebar-toggle:hover {
    background: #e5e7eb;
    color: #374151;
  }
  
  .sidebar-nav {
    flex: 1;
    padding: 1rem 0;
    overflow-y: auto;
  }
  
  .nav-item {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    border: none;
    background: none;
    cursor: pointer;
    text-align: left;
    transition: all 0.2s;
    color: #6b7280;
    font-size: 0.875rem;
    font-weight: 500;
  }
  
  .nav-item:hover {
    background: #f9fafb;
    color: #374151;
  }
  
  .nav-item.active {
    background: #eff6ff;
    color: #1d4ed8;
    border-right: 3px solid #3b82f6;
  }
  
  .nav-icon {
    font-size: 1.25rem;
    flex-shrink: 0;
  }
  
  .nav-label {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .sidebar-footer {
    padding: 1rem;
    border-top: 1px solid #e5e7eb;
  }
  
  .service-stats {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .stat {
    display: flex;
    justify-content: space-between;
    font-size: 0.75rem;
  }
  
  .stat-label {
    color: #6b7280;
  }
  
  .stat-value {
    color: #1f2937;
    font-weight: 500;
  }
  
  .main-content {
    flex: 1;
    margin-left: 280px;
    transition: margin-left 0.3s ease;
    min-height: 100vh;
  }
  
  .service-app.sidebar-collapsed .main-content {
    margin-left: 60px;
  }
  
  /* Fallback UI Styling */
  .fallback-ui {
    padding: 2rem;
  }
  
  .page-header {
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .page-header h1 {
    font-size: 2rem;
    font-weight: 700;
    color: #1f2937;
    margin: 0 0 0.5rem 0;
  }
  
  .page-header p {
    color: #6b7280;
    margin: 0;
  }
  
  .fallback-content {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }
  
  .info-section, .entities-section {
    background: white;
    border-radius: 8px;
    padding: 1.5rem;
    border: 1px solid #e5e7eb;
  }
  
  .info-section h3, .entities-section h3 {
    margin: 0 0 1rem 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
  }
  
  .info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }
  
  .entities-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1rem;
  }
  
  .entity-card {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    padding: 1rem;
    text-align: center;
  }
  
  .entity-card h4 {
    margin: 0 0 0.5rem 0;
    color: #1f2937;
  }
  
  .entity-card p {
    margin: 0 0 1rem 0;
    color: #6b7280;
    font-size: 0.875rem;
  }
  
  .entity-card button {
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 0.5rem 1rem;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 500;
    transition: background-color 0.2s;
  }
  
  .entity-card button:hover {
    background: #2563eb;
  }
  
  /* Responsive Design */
  @media (max-width: 768px) {
    .sidebar {
      width: 100%;
      transform: translateX(-100%);
    }
    
    .sidebar.collapsed {
      width: 100%;
      transform: translateX(-100%);
    }
    
    .main-content {
      margin-left: 0;
    }
    
    .service-app.sidebar-collapsed .main-content {
      margin-left: 0;
    }
  }
</style>
