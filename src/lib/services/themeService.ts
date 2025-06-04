/**
 * Theme Service - Handles dynamic theme loading and switching
 * Maintains coherence with the three-legged stool architecture
 */

import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export interface ThemeConfig {
  id: string;
  name: string;
  description: string;
  css_file: string;
  preview_colors: {
    primary: string;
    background: string;
    text: string;
  };
}

export interface LayoutConfig {
  id: string;
  name: string;
  description: string;
  sidebar_width: number;
  header_height: number;
  content_padding: number;
}

// Theme and layout stores
export const currentTheme = writable<string>('professional');
export const currentLayout = writable<string>('standard');
export const availableThemes = writable<ThemeConfig[]>([]);
export const availableLayouts = writable<LayoutConfig[]>([]);

class ThemeService {
  private currentThemeLink: HTMLLinkElement | null = null;

  /**
   * Initialize theme service with contract UI configuration
   */
  async initialize(contractUI: any) {
    if (!browser) return;

    // Set available themes and layouts from contract UI
    if (contractUI?.theme?.available_themes) {
      availableThemes.set(contractUI.theme.available_themes);
    }
    
    if (contractUI?.layout_options?.available_layouts) {
      availableLayouts.set(contractUI.layout_options.available_layouts);
    }

    // Set current theme and layout
    const initialTheme = contractUI?.theme?.current_theme || 'professional';
    const initialLayout = contractUI?.layout_options?.current_layout || 'standard';
    
    currentTheme.set(initialTheme);
    currentLayout.set(initialLayout);

    // Load the initial theme
    await this.loadTheme(initialTheme);
    this.applyLayout(initialLayout, contractUI?.layout_options?.available_layouts);
  }

  /**
   * Load a theme CSS file dynamically
   */
  async loadTheme(themeId: string): Promise<void> {
    if (!browser) return;

    try {
      // Remove existing theme link
      if (this.currentThemeLink) {
        this.currentThemeLink.remove();
        this.currentThemeLink = null;
      }

      // Create new theme link
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = `/themes/${themeId}.css`;
      link.id = `theme-${themeId}`;
      
      // Wait for CSS to load
      await new Promise<void>((resolve, reject) => {
        link.onload = () => {
          console.log(`🎨 Theme CSS loaded successfully: ${themeId}`);
          resolve();
        };
        link.onerror = (error) => {
          console.error(`❌ Failed to load theme CSS: ${themeId}`, error);
          reject(new Error(`Failed to load theme: ${themeId}`));
        };
        
        // Add timeout to prevent hanging
        setTimeout(() => {
          reject(new Error(`Theme loading timeout: ${themeId}`));
        }, 5000);
        
        document.head.appendChild(link);
      });

      this.currentThemeLink = link;
      currentTheme.set(themeId);
      
      console.log(`🎨 Theme switched to: ${themeId}`);
    } catch (error) {
      console.error('Failed to load theme:', error);
      // Don't throw error to prevent UI breaking
      // Just log it and continue with current theme
    }
  }

  /**
   * Apply layout configuration using CSS variables
   */
  applyLayout(layoutId: string, layouts: LayoutConfig[]): void {
    if (!browser) return;

    const layout = layouts?.find(l => l.id === layoutId);
    if (!layout) return;

    // Apply layout CSS variables
    const root = document.documentElement;
    root.style.setProperty('--sidebar-width', `${layout.sidebar_width}px`);
    root.style.setProperty('--header-height', `${layout.header_height}px`);
    root.style.setProperty('--content-padding', `${layout.content_padding}px`);

    currentLayout.set(layoutId);
    
    console.log(`📐 Layout applied: ${layoutId}`, layout);
  }

  /**
   * Switch to a new theme
   */
  async switchTheme(themeId: string): Promise<void> {
    try {
      await this.loadTheme(themeId);
      
      // Save theme preference (could be saved to Supabase user preferences later)
      if (browser) {
        localStorage.setItem('osp-preferred-theme', themeId);
      }
    } catch (error) {
      console.error('Failed to switch theme:', error);
      // Don't throw error to prevent UI breaking
      // Just log it and continue with current theme
    }
  }

  /**
   * Switch to a new layout
   */
  async switchLayout(layoutId: string, layouts: LayoutConfig[]): Promise<void> {
    try {
      this.applyLayout(layoutId, layouts);
      
      // Save layout preference
      if (browser) {
        localStorage.setItem('osp-preferred-layout', layoutId);
      }
    } catch (error) {
      console.error('Failed to switch layout:', error);
      throw error;
    }
  }

  /**
   * Get saved user preferences
   */
  getSavedPreferences(): { theme?: string; layout?: string } {
    if (!browser) return {};
    
    return {
      theme: localStorage.getItem('osp-preferred-theme') || undefined,
      layout: localStorage.getItem('osp-preferred-layout') || undefined
    };
  }

  /**
   * Apply custom CSS (for advanced users)
   */
  applyCustomCSS(customCSS: string): void {
    if (!browser) return;

    // Remove existing custom CSS
    const existingCustom = document.getElementById('osp-custom-css');
    if (existingCustom) {
      existingCustom.remove();
    }

    if (!customCSS.trim()) return;

    // Add new custom CSS
    const style = document.createElement('style');
    style.id = 'osp-custom-css';
    style.textContent = customCSS;
    document.head.appendChild(style);
    
    console.log('🎨 Custom CSS applied');
  }
}

// Export singleton instance
export const themeService = new ThemeService(); 