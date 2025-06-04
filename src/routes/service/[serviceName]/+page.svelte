<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import DynamicPageRenderer from '$lib/components/DynamicPageRenderer.svelte';
  import ThemePicker from '$lib/components/ui/ThemePicker.svelte';
  import { themeService } from '$lib/services/themeService';
  
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
    </div>
    
    <div class="header-right">
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
    {#if contractUI && contractUI.pages?.length > 0}
      <!-- Dynamic Contract UI Rendering -->
      <DynamicPageRenderer 
        {contractUI}
        {currentPath}
        {serviceSchema}
        serviceName={displayServiceName}
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
  }
</style>
