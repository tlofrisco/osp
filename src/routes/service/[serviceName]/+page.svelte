<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { page } from '$app/stores';
  import DynamicPageRenderer from '$lib/components/DynamicPageRenderer.svelte';
  import ThemePicker from '$lib/components/ui/ThemePicker.svelte';
  import { themeService } from '$lib/services/themeService';
  import ServiceRegenerator from '$lib/components/ServiceRegenerator.svelte';
  import SchemaEvolution from '$lib/components/SchemaEvolution.svelte';
  // Using emojis instead of lucide-svelte icons for consistency
  
  /** @type {import('./$types').PageData} */
  export let data;

  // Extract data and get contract UI
  const { serviceName, service, tables } = data;
  const serviceSchema = service?.service_schema;
  const contractUI = service?.contract_ui;
  
  // 🏷️ Extract proper service name from manifest
  let displayServiceName = serviceName;
  let serviceDescription = '';
  
  // Try to get human-readable name from manifest metadata
  if (service?.metadata?.name) {
    displayServiceName = service.metadata.name;
  } else if (service?.metadata?.origin_prompt) {
    // Extract a better name from the original prompt
    const prompt = service.metadata.origin_prompt;
    if (prompt.toLowerCase().includes('restaurant')) {
      displayServiceName = 'Restaurant Management System';
    } else if (prompt.toLowerCase().includes('bike') || prompt.toLowerCase().includes('inventory')) {
      displayServiceName = 'Inventory Management System';
    } else {
      // Generic fallback - capitalize and clean the schema name
      displayServiceName = serviceName
        .replace(/^a_|^the_/i, '') // Remove article prefixes
        .replace(/_\d+$/, '') // Remove version suffix
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c: string) => c.toUpperCase());
    }
  }
  
  // Extract description from metadata if available
  if (service?.metadata?.origin_prompt) {
    serviceDescription = service.metadata.origin_prompt;
  }
  
  console.log('🎯 Service Page Data:', {
    serviceName,
    displayServiceName,
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
  
  // Regeneration UI state
  let showRegenerator = false;
  let showEvolution = false;
  
  // Role testing - simple stub for workflow testing
  let currentRole = 'waitress'; // 'waitress' | 'manager'
  let showRoleSelector = true;
  
  // Workflow testing status
  let workflowExecutions = [];
  let showWorkflowStatus = true;
  
  // Auto-refresh workflow executions every 10 seconds during testing
  let refreshInterval: number;
  
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
  
  onMount(async () => {
    console.log('🚀 Service Page mounted for:', serviceName);
    console.log('Contract UI available:', !!contractUI);
    console.log('Available pages:', contractUI?.pages?.length || 0);
    
    // ✨ Initialize theme system
    if (contractUI) {
      try {
        await themeService.initialize(contractUI);
        console.log('🎨 Theme system initialized');
      } catch (error) {
        console.error('Failed to initialize theme system:', error);
      }
    }
    
    // Load recent workflow executions for testing
    await loadRecentWorkflowExecutions();
  });
  
  async function loadRecentWorkflowExecutions() {
    if (!serviceSchema) return;
    
    try {
      const response = await fetch(`/api/workflows/executions?service=${serviceSchema}&limit=5`);
      if (response.ok) {
        const data = await response.json();
        workflowExecutions = data.executions || [];
      }
    } catch (error) {
      console.error('Failed to load workflow executions:', error);
    }
  }
  
  $: if (showWorkflowStatus && serviceSchema) {
    if (refreshInterval) clearInterval(refreshInterval);
    refreshInterval = setInterval(loadRecentWorkflowExecutions, 10000);
  }
  
  // Cleanup interval on component destroy
  onDestroy(() => {
    if (refreshInterval) clearInterval(refreshInterval);
  });

  function getDisplayIcon(icon: string, label: string): string {
    // Map Material Design icon names to emoji
    const materialIconMap: Record<string, string> = {
      'dashboard': '📈',
      'workflow': '⚙️',
      'person': '👤',
      'group': '👥',
      'inventory': '📦',
      'shopping_cart': '🛒',
      'shopping_bag': '🛍️',
      'table_view': '🪑',
      'event': '📅',
      'restaurant_menu': '🍽️',
      'category': '📂',
      'folder': '📁',
      'payment': '💳',
      'attach_money': '💰',
      'kitchen': '👨‍🍳',
      'star': '⭐',
      'receipt': '🧾',
      'place': '📍',
      'location_on': '📌',
      'contact_phone': '📞',
      'message': '💬',
      'notifications': '🔔',
      'analytics': '📊',
      'settings': '⚙️',
      'tune': '🔧',
      'process': '🔄',
      'task_alt': '✅',
      'work': '💼',
      'description': '📋'
    };
    
    // First check if we have a direct icon mapping
    if (materialIconMap[icon]) {
      return materialIconMap[icon];
    }
    
    // Fallback to label-based mapping for better UX
    return getIconByLabel(label);
  }
  
  function getIconByLabel(label: string): string {
    const labelLower = label.toLowerCase();
    
    // Restaurant-specific entity icons
    if (labelLower.includes('order')) return '📋';
    if (labelLower.includes('table')) return '🪑';
    if (labelLower.includes('reservation')) return '📅';
    if (labelLower.includes('inventory')) return '📦';
    if (labelLower.includes('customer')) return '👤';
    if (labelLower.includes('staff')) return '👥';
    if (labelLower.includes('menu item')) return '🍽️';
    if (labelLower.includes('menu category')) return '📂';
    if (labelLower.includes('payment')) return '💳';
    if (labelLower.includes('kitchen')) return '👨‍🍳';
    if (labelLower.includes('feedback')) return '⭐';
    if (labelLower.includes('workflow')) return '⚙️';
    
    // Generic fallbacks
    if (labelLower.includes('user') || labelLower.includes('people')) return '👤';
    if (labelLower.includes('product') || labelLower.includes('item')) return '📦';
    if (labelLower.includes('sale') || labelLower.includes('transaction')) return '💰';
    if (labelLower.includes('report') || labelLower.includes('analytics')) return '📊';
    if (labelLower.includes('message') || labelLower.includes('chat')) return '💬';
    if (labelLower.includes('notification')) return '🔔';
    if (labelLower.includes('setting') || labelLower.includes('config')) return '⚙️';
    
    return '📋'; // Ultimate fallback
  }
</script>

<!-- ✨ Modern Three-Pane Layout with Theme Support -->
<div class="service-app" class:sidebar-collapsed={!sidebarOpen}>
  <!-- Fixed Header -->
  <header class="header">
    <div class="header-left">
      <button class="sidebar-toggle" on:click={toggleSidebar}>
        {sidebarOpen ? '☰' : '☰'}
      </button>
      <h1 class="service-title">{displayServiceName}</h1>
      
      <!-- Role Selector for Testing -->
      {#if showRoleSelector}
        <div class="role-selector">
          <label for="role-select">Role:</label>
          <select id="role-select" bind:value={currentRole} class="role-select">
            <option value="waitress">👩‍💼 Waitress</option>
            <option value="manager">👨‍💼 Manager</option>
          </select>
        </div>
      {/if}
    </div>
    
    <div class="header-right">
      <!-- Workflow Status for Testing -->
      {#if showWorkflowStatus && workflowExecutions.length > 0}
        <div class="workflow-status-indicator">
          <span class="status-icon">⚙️</span>
          <span class="status-count">{workflowExecutions.length}</span>
          <div class="status-tooltip">
            <div class="status-header">Recent Workflows</div>
            {#each workflowExecutions.slice(0, 3) as execution}
              <div class="status-item">
                <span class="status-badge status-{execution.status}">{execution.status}</span>
                <span class="status-name">{execution.workflow_id}</span>
                <span class="status-time">{new Date(execution.created_at).toLocaleTimeString()}</span>
              </div>
            {/each}
            {#if workflowExecutions.length > 3}
              <div class="status-more">+{workflowExecutions.length - 3} more</div>
            {/if}
          </div>
        </div>
      {/if}
      
      <!-- Regeneration Controls -->
      <button 
        class="header-button"
        on:click={() => showEvolution = !showEvolution}
        title="Schema Evolution History"
      >
        🌿
      </button>
      <button 
        class="header-button"
        on:click={() => showRegenerator = !showRegenerator}
        title="Regenerate Service"
      >
        🔄
      </button>
      
      <!-- ✨ Theme Picker Integration -->
      <ThemePicker {contractUI} compact={true} />
    </div>
  </header>

  <!-- Sidebar Navigation -->
  <aside class="sidebar" class:collapsed={!sidebarOpen}>
    <nav class="sidebar-nav">
      {#if navigationItems.length > 0}
        {#each navigationItems as navItem (navItem.path)}
          <button 
            class="nav-item"
            class:active={currentPath === navItem.path}
            on:click={() => navigateToPage(navItem.path)}
          >
            {#if navItem.icon}
              <span class="nav-icon">{getDisplayIcon(navItem.icon, navItem.label)}</span>
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
    <!-- Regeneration Panel (Slide-in) -->
    {#if showRegenerator}
      <div class="slide-panel regenerator-panel">
        <div class="panel-header">
          <h3>Regenerate Service</h3>
          <button class="close-button" on:click={() => showRegenerator = false}>×</button>
        </div>
        <div class="panel-content">
          <ServiceRegenerator 
            serviceId={service?.id}
            serviceName={displayServiceName}
            currentVersion={service?.version || 1}
            on:regenerated={() => {
              showRegenerator = false;
              // Optionally reload the page or update the service data
              window.location.reload();
            }}
          />
        </div>
      </div>
    {/if}
    
    <!-- Schema Evolution Panel (Slide-in) -->
    {#if showEvolution}
      <div class="slide-panel evolution-panel">
        <div class="panel-header">
          <h3>Schema Evolution</h3>
          <button class="close-button" on:click={() => showEvolution = false}>×</button>
        </div>
        <div class="panel-content">
          <SchemaEvolution serviceId={serviceSchema} />
        </div>
      </div>
    {/if}
    
    {#if contractUI && contractUI.pages?.length > 0}
      <!-- Dynamic Contract UI Rendering -->
      <DynamicPageRenderer 
        {contractUI}
        {currentPath}
        {serviceSchema}
        serviceName={displayServiceName}
        {currentRole}
      />
    {:else}
      <!-- Fallback UI for services without contract UI -->
      <div class="fallback-ui">
        <div class="fallback-content">
          <div class="info-section">
            <h3>Service Information</h3>
            <div class="info-grid">
              <div><strong>Name:</strong> {displayServiceName}</div>
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
  /* ✨ Modern Three-Pane Layout with Theme Support */
  .service-app {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    background: var(--bg-primary, #f8fafc);
    font-family: var(--font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
  }
  
  /* Fixed Header */
  .header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: var(--header-height, 60px);
    background: var(--surface-color, #ffffff);
    border-bottom: 1px solid var(--border-color, #e5e7eb);
    box-shadow: var(--shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05));
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 var(--spacing-lg, 24px);
    z-index: 100;
  }
  
  .header-left {
    display: flex;
    align-items: center;
    gap: var(--spacing-md, 16px);
  }
  
  .header-right {
    display: flex;
    align-items: center;
    gap: var(--spacing-md, 16px);
  }
  
  .service-title {
    font-size: var(--font-size-lg, 18px);
    font-weight: 600;
    color: var(--text-primary, #1f2937);
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .sidebar-toggle {
    background: var(--bg-secondary, #f3f4f6);
    border: 1px solid var(--border-color, #e5e7eb);
    border-radius: var(--border-radius, 6px);
    padding: var(--spacing-sm, 8px);
    cursor: pointer;
    font-size: var(--font-size-base, 16px);
    color: var(--text-secondary, #6b7280);
    transition: all 0.2s ease;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .sidebar-toggle:hover {
    background: var(--bg-tertiary, #e5e7eb);
    color: var(--text-primary, #374151);
  }
  
  /* Header Buttons */
  .header-button {
    background: var(--bg-secondary, #f3f4f6);
    border: 1px solid var(--border-color, #e5e7eb);
    border-radius: var(--border-radius, 6px);
    padding: var(--spacing-sm, 8px);
    cursor: pointer;
    color: var(--text-secondary, #6b7280);
    transition: all 0.2s ease;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .header-button:hover {
    background: var(--bg-tertiary, #e5e7eb);
    color: var(--text-primary, #374151);
  }
  
  /* Sidebar */
  .sidebar {
    position: fixed;
    left: 0;
    top: var(--header-height, 60px);
    width: var(--sidebar-width, 280px);
    height: calc(100vh - var(--header-height, 60px));
    background: var(--surface-color, #ffffff);
    border-right: 1px solid var(--border-color, #e5e7eb);
    display: flex;
    flex-direction: column;
    transition: width 0.3s ease;
    z-index: 50;
  }
  
  .sidebar.collapsed {
    width: 60px;
  }
  
  .sidebar-nav {
    flex: 1;
    padding: var(--spacing-md, 16px) 0;
    overflow-y: auto;
  }
  
  .nav-item {
    width: 100%;
    display: flex;
    align-items: center;
    gap: var(--spacing-md, 16px);
    padding: var(--spacing-md, 16px);
    border: none;
    background: none;
    cursor: pointer;
    text-align: left;
    transition: all 0.2s ease;
    color: var(--text-secondary, #6b7280);
    font-size: var(--font-size-sm, 14px);
    font-weight: 500;
    border-radius: var(--border-radius, 6px);
    margin: 0 var(--spacing-sm, 8px);
  }
  
  .nav-item:hover {
    background: var(--bg-secondary, #f9fafb);
    color: var(--text-primary, #374151);
  }
  
  .nav-item.active {
    background: var(--primary-light, #eff6ff);
    color: var(--primary-color, #1d4ed8);
    font-weight: 600;
  }
  
  .nav-icon {
    font-size: var(--font-size-lg, 18px);
    flex-shrink: 0;
    width: 24px;
    text-align: center;
  }
  
  .nav-label {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .sidebar-footer {
    padding: var(--spacing-md, 16px);
    border-top: 1px solid var(--border-light, #f3f4f6);
  }
  
  .service-stats {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm, 8px);
  }
  
  .stat {
    display: flex;
    justify-content: space-between;
    font-size: var(--font-size-xs, 12px);
  }
  
  .stat-label {
    color: var(--text-muted, #6b7280);
  }
  
  .stat-value {
    color: var(--text-primary, #1f2937);
    font-weight: 500;
  }
  
  /* Main Content */
  .main-content {
    margin-left: var(--sidebar-width, 280px);
    margin-top: var(--header-height, 60px);
    min-height: calc(100vh - var(--header-height, 60px));
    transition: margin-left 0.3s ease;
    padding: var(--content-padding, 24px);
  }
  
  .service-app.sidebar-collapsed .main-content {
    margin-left: 60px;
  }
  
  /* Fallback UI Styling */
  .fallback-ui {
    padding: 0;
  }
  
  .fallback-content {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xl, 32px);
  }
  
  .info-section, 
  .entities-section {
    background: var(--card-bg, #ffffff);
    border-radius: var(--border-radius, 8px);
    padding: var(--spacing-lg, 24px);
    border: 1px solid var(--border-color, #e5e7eb);
    box-shadow: var(--shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05));
  }
  
  .info-section h3, 
  .entities-section h3 {
    margin: 0 0 var(--spacing-md, 16px) 0;
    font-size: var(--font-size-xl, 20px);
    font-weight: 600;
    color: var(--text-primary, #1f2937);
  }
  
  .info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--spacing-md, 16px);
  }
  
  .info-grid > div {
    color: var(--text-secondary, #374151);
    font-size: var(--font-size-sm, 14px);
  }
  
  .info-grid strong {
    color: var(--text-primary, #1f2937);
    font-weight: 600;
  }
  
  .entities-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: var(--spacing-md, 16px);
  }
  
  .entity-card {
    background: var(--bg-secondary, #f9fafb);
    border: 1px solid var(--border-light, #e5e7eb);
    border-radius: var(--border-radius, 6px);
    padding: var(--spacing-md, 16px);
    text-align: center;
    transition: all 0.2s ease;
  }
  
  .entity-card:hover {
    border-color: var(--primary-color, #2563eb);
    box-shadow: var(--shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1));
  }
  
  .entity-card h4 {
    margin: 0 0 var(--spacing-sm, 8px) 0;
    font-size: var(--font-size-base, 16px);
    font-weight: 600;
    color: var(--text-primary, #1f2937);
  }
  
  .entity-card p {
    margin: 0 0 var(--spacing-md, 16px) 0;
    color: var(--text-muted, #6b7280);
    font-size: var(--font-size-sm, 14px);
  }
  
  .entity-card button {
    background: var(--primary-color, #2563eb);
    color: var(--text-inverse, #ffffff);
    border: none;
    border-radius: var(--border-radius, 6px);
    padding: var(--spacing-sm, 8px) var(--spacing-md, 16px);
    font-size: var(--font-size-sm, 14px);
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .entity-card button:hover {
    background: var(--primary-hover, #1d4ed8);
    transform: translateY(-1px);
    box-shadow: var(--shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1));
  }
  
  /* Slide Panels */
  .slide-panel {
    position: fixed;
    top: var(--header-height, 60px);
    right: 0;
    width: 480px;
    height: calc(100vh - var(--header-height, 60px));
    background: var(--surface-color, #ffffff);
    border-left: 1px solid var(--border-color, #e5e7eb);
    box-shadow: var(--shadow-xl, -4px 0 6px -1px rgba(0, 0, 0, 0.1));
    z-index: 200;
    display: flex;
    flex-direction: column;
    animation: slideIn 0.3s ease-out;
  }
  
  @keyframes slideIn {
    from {
      transform: translateX(100%);
    }
    to {
      transform: translateX(0);
    }
  }
  
  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-lg, 24px);
    border-bottom: 1px solid var(--border-color, #e5e7eb);
  }
  
  .panel-header h3 {
    margin: 0;
    font-size: var(--font-size-lg, 18px);
    font-weight: 600;
    color: var(--text-primary, #1f2937);
  }
  
  .close-button {
    background: none;
    border: none;
    font-size: 24px;
    color: var(--text-secondary, #6b7280);
    cursor: pointer;
    padding: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--border-radius, 6px);
    transition: all 0.2s ease;
  }
  
  .close-button:hover {
    background: var(--bg-secondary, #f3f4f6);
    color: var(--text-primary, #1f2937);
  }
  
  .panel-content {
    flex: 1;
    padding: var(--spacing-lg, 24px);
    overflow-y: auto;
  }
  
  /* Responsive Design */
  @media (max-width: 768px) {
    .sidebar {
      transform: translateX(-100%);
    }
    
    .sidebar:not(.collapsed) {
      transform: translateX(0);
    }
    
    .main-content {
      margin-left: 0;
    }
    
    .service-app.sidebar-collapsed .main-content {
      margin-left: 0;
    }
    
    .header-left .service-title {
      display: none;
    }
    
    .slide-panel {
      width: 100%;
    }
  }
  
  /* Role Selector */
  .role-selector {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm, 8px);
    padding: var(--spacing-sm, 8px) var(--spacing-md, 16px);
    background: var(--bg-secondary, #f3f4f6);
    border: 1px solid var(--border-color, #e5e7eb);
    border-radius: var(--border-radius, 6px);
    font-size: var(--font-size-sm, 14px);
  }
  
  .role-selector label {
    color: var(--text-secondary, #6b7280);
    font-weight: 500;
    margin: 0;
  }
  
  .role-select {
    background: white;
    border: 1px solid var(--border-color, #e5e7eb);
    border-radius: 4px;
    padding: 4px 8px;
    font-size: var(--font-size-sm, 14px);
    color: var(--text-primary, #374151);
    cursor: pointer;
  }
  
  .role-select:focus {
    outline: none;
    border-color: var(--primary-color, #1d4ed8);
    box-shadow: 0 0 0 2px rgba(29, 78, 216, 0.1);
  }
  
  /* Workflow Status Indicator */
  .workflow-status-indicator {
    position: relative;
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px 10px;
    background: var(--bg-secondary, #f3f4f6);
    border: 1px solid var(--border-color, #e5e7eb);
    border-radius: var(--border-radius, 6px);
    font-size: var(--font-size-sm, 14px);
    cursor: pointer;
  }
  
  .workflow-status-indicator:hover .status-tooltip {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
  }
  
  .status-icon {
    font-size: 16px;
  }
  
  .status-count {
    background: var(--primary-color, #1d4ed8);
    color: white;
    border-radius: 10px;
    padding: 2px 6px;
    font-size: 12px;
    font-weight: 600;
    min-width: 18px;
    text-align: center;
  }
  
  .status-tooltip {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 8px;
    background: white;
    border: 1px solid var(--border-color, #e5e7eb);
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    padding: 12px;
    min-width: 280px;
    opacity: 0;
    visibility: hidden;
    transform: translateY(-8px);
    transition: all 0.2s ease;
    z-index: 1000;
  }
  
  .status-header {
    font-weight: 600;
    margin-bottom: 8px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--border-color, #e5e7eb);
    color: var(--text-primary, #1f2937);
  }
  
  .status-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 0;
    font-size: 12px;
  }
  
  .status-badge {
    padding: 2px 6px;
    border-radius: 4px;
    font-weight: 500;
    text-transform: capitalize;
  }
  
  .status-badge.status-running {
    background: #fef3c7;
    color: #d97706;
  }
  
  .status-badge.status-completed {
    background: #d1fae5;
    color: #065f46;
  }
  
  .status-badge.status-failed {
    background: #fee2e2;
    color: #dc2626;
  }
  
  .status-badge.status-pending {
    background: #e0e7ff;
    color: #3730a3;
  }
  
  .status-name {
    flex: 1;
    color: var(--text-primary, #374151);
  }
  
  .status-time {
    color: var(--text-secondary, #6b7280);
    font-size: 11px;
  }
  
  .status-more {
    text-align: center;
    padding-top: 8px;
    margin-top: 8px;
    border-top: 1px solid var(--border-color, #e5e7eb);
    color: var(--text-secondary, #6b7280);
    font-size: 11px;
  }
</style>
