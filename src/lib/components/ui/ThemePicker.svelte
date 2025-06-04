<script lang="ts">
  import { onMount } from 'svelte';
  import { 
    themeService, 
    currentTheme, 
    currentLayout,
    availableThemes, 
    availableLayouts,
    type ThemeConfig,
    type LayoutConfig 
  } from '$lib/services/themeService';

  // Props
  export let contractUI: any;
  export let showLayoutOptions: boolean = true;
  export let compact: boolean = false;

  // Local state
  let themes: ThemeConfig[] = [];
  let layouts: LayoutConfig[] = [];
  let selectedTheme: string = 'professional';
  let selectedLayout: string = 'standard';
  let isOpen: boolean = false;
  let pickerElement: HTMLElement;

  // Subscribe to stores
  $: themes = $availableThemes;
  $: layouts = $availableLayouts;
  $: selectedTheme = $currentTheme;
  $: selectedLayout = $currentLayout;

  onMount(() => {
    // Async initialization
    async function initialize() {
      if (contractUI) {
        await themeService.initialize(contractUI);
      }
    }
    
    // Call the async function
    initialize().catch(error => {
      console.error('Failed to initialize theme service:', error);
    });
    
    // Add click outside handler
    function handleClickOutside(event: MouseEvent) {
      if (pickerElement && !pickerElement.contains(event.target as Node)) {
        isOpen = false;
      }
    }
    
    document.addEventListener('click', handleClickOutside);
    
    // Return cleanup function
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  });

  async function handleThemeChange(themeId: string) {
    try {
      console.log(`🎨 User selected theme: ${themeId}`);
      await themeService.switchTheme(themeId);
      console.log(`✅ Theme switched successfully to: ${themeId}`);
      
      // Close the picker after successful theme change
      isOpen = false;
    } catch (error) {
      console.error('❌ Failed to switch theme:', error);
      // You could add a toast notification here for user feedback
    }
  }

  async function handleLayoutChange(layoutId: string) {
    try {
      console.log(`📐 User selected layout: ${layoutId}`);
      await themeService.switchLayout(layoutId, layouts);
      console.log(`✅ Layout switched successfully to: ${layoutId}`);
      
      // Close the picker after successful layout change
      isOpen = false;
    } catch (error) {
      console.error('❌ Failed to switch layout:', error);
      // You could add a toast notification here for user feedback
    }
  }

  function togglePicker(event: MouseEvent) {
    event.stopPropagation();
    isOpen = !isOpen;
    console.log(`🎨 Theme picker ${isOpen ? 'opened' : 'closed'}`);
  }
</script>

<!-- Theme Picker Button -->
<div class="theme-picker-container" class:compact bind:this={pickerElement}>
  <button 
    class="theme-picker-button"
    on:click={togglePicker}
    aria-label="Customize appearance"
  >
    <span class="icon">🎨</span>
    {#if !compact}
      <span class="text">Appearance</span>
    {/if}
  </button>

  <!-- Theme Selection Panel -->
  {#if isOpen}
    <div class="theme-panel" class:compact>
      <div class="panel-header">
        <h3>Customize Appearance</h3>
        <button class="close-button" on:click={togglePicker}>×</button>
      </div>

      <!-- Theme Selection -->
      <div class="section">
        <h4>Visual Theme</h4>
        <div class="theme-grid">
          {#each themes as theme}
            <button
              class="theme-option"
              class:active={selectedTheme === theme.id}
              on:click={() => handleThemeChange(theme.id)}
            >
              <div class="theme-preview">
                <div 
                  class="color-bar primary" 
                  style="background-color: {theme.preview_colors.primary}"
                ></div>
                <div 
                  class="color-bar background" 
                  style="background-color: {theme.preview_colors.background}"
                ></div>
                <div 
                  class="color-bar text" 
                  style="background-color: {theme.preview_colors.text}"
                ></div>
              </div>
              <div class="theme-info">
                <span class="theme-name">{theme.name}</span>
                <span class="theme-description">{theme.description}</span>
              </div>
            </button>
          {/each}
        </div>
      </div>

      <!-- Layout Selection -->
      {#if showLayoutOptions}
        <div class="section">
          <h4>Layout Style</h4>
          <div class="layout-grid">
            {#each layouts as layout}
              <button
                class="layout-option"
                class:active={selectedLayout === layout.id}
                on:click={() => handleLayoutChange(layout.id)}
              >
                <div class="layout-preview">
                  <div class="mini-sidebar"></div>
                  <div class="mini-content">
                    <div class="mini-header"></div>
                    <div class="mini-body"></div>
                  </div>
                </div>
                <div class="layout-info">
                  <span class="layout-name">{layout.name}</span>
                  <span class="layout-description">{layout.description}</span>
                </div>
              </button>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .theme-picker-container {
    position: relative;
    display: inline-block;
  }

  .theme-picker-button {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: var(--surface-color, #ffffff);
    border: 1px solid var(--border-color, #e5e7eb);
    border-radius: var(--border-radius, 6px);
    color: var(--text-secondary, #374151);
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 14px;
  }

  .theme-picker-button:hover {
    background: var(--bg-secondary, #f9fafb);
    border-color: var(--primary-color, #2563eb);
  }

  .compact .theme-picker-button {
    padding: 6px;
  }

  .icon {
    font-size: 16px;
  }

  .theme-panel {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    width: 320px;
    background: var(--surface-color, #ffffff);
    border: 1px solid var(--border-color, #e5e7eb);
    border-radius: var(--border-radius, 6px);
    box-shadow: var(--shadow-lg, 0 10px 15px -3px rgba(0, 0, 0, 0.1));
    z-index: 1000;
    padding: 16px;
  }

  .compact .theme-panel {
    width: 280px;
    right: -120px;
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--border-light, #f3f4f6);
  }

  .panel-header h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary, #111827);
  }

  .close-button {
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
    color: var(--text-muted, #6b7280);
    padding: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .close-button:hover {
    color: var(--text-primary, #111827);
  }

  .section {
    margin-bottom: 16px;
  }

  .section:last-child {
    margin-bottom: 0;
  }

  .section h4 {
    margin: 0 0 12px 0;
    font-size: 14px;
    font-weight: 500;
    color: var(--text-secondary, #374151);
  }

  .theme-grid,
  .layout-grid {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .theme-option,
  .layout-option {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: var(--bg-secondary, #f9fafb);
    border: 1px solid var(--border-light, #f3f4f6);
    border-radius: var(--border-radius, 6px);
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: left;
    width: 100%;
  }

  .theme-option:hover,
  .layout-option:hover {
    border-color: var(--primary-color, #2563eb);
    background: var(--surface-color, #ffffff);
  }

  .theme-option.active,
  .layout-option.active {
    border-color: var(--primary-color, #2563eb);
    background: var(--surface-color, #ffffff);
    box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
  }

  .theme-preview {
    display: flex;
    flex-direction: column;
    width: 32px;
    height: 24px;
    border-radius: 4px;
    overflow: hidden;
    border: 1px solid var(--border-color, #e5e7eb);
  }

  .color-bar {
    flex: 1;
  }

  .layout-preview {
    display: flex;
    width: 32px;
    height: 24px;
    border: 1px solid var(--border-color, #e5e7eb);
    border-radius: 4px;
    overflow: hidden;
  }

  .mini-sidebar {
    width: 8px;
    background: var(--text-muted, #6b7280);
  }

  .mini-content {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .mini-header {
    height: 6px;
    background: var(--primary-color, #2563eb);
  }

  .mini-body {
    flex: 1;
    background: var(--bg-secondary, #f9fafb);
  }

  .theme-info,
  .layout-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .theme-name,
  .layout-name {
    font-size: 13px;
    font-weight: 500;
    color: var(--text-primary, #111827);
  }

  .theme-description,
  .layout-description {
    font-size: 11px;
    color: var(--text-muted, #6b7280);
    line-height: 1.3;
  }
</style> 