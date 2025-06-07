<script lang="ts">
  import { onMount } from 'svelte';
  
  export let config: any;
  export let metadata: any = {};
  export let serviceSchema: string = '';
  export let entities: any[] = []; // Pass entities from contract UI
  
  // Additional props for compatibility (to avoid warnings)
  export let serviceName: string = '';
  export let currentRole: string = 'waitress';
  
  let stats: any[] = [];
  let loading = true;
  let error = '';
  
  // Fetch real statistics for all entities
  async function fetchStats() {
    if (!serviceSchema || !entities?.length) {
      error = 'Missing schema or entities';
      loading = false;
      return;
    }
    
    loading = true;
    error = '';
    
    try {
      console.log(`📊 Fetching stats for ${serviceSchema} entities:`, entities.map(e => e.name));
      
      // Fetch count for each entity
      const statPromises = entities.map(async (entity) => {
        try {
          const apiUrl = `/api/services/${serviceSchema}/${entity.name}?limit=1`;
          const response = await fetch(apiUrl);
          const result = await response.json();
          
          if (!response.ok || !result.success) {
            console.warn(`⚠️ Failed to fetch ${entity.name} count:`, result.error);
            return {
              label: formatEntityName(entity.name),
              value: '?',
              icon: getEntityIcon(entity.name),
              trend: null,
              entity: entity.name
            };
          }
          
          // For now, we'll use the returned count, but in a real scenario 
          // you'd want a dedicated count endpoint for performance
          const count = result.data?.length || 0;
          
          return {
            label: formatEntityName(entity.name),
            value: count,
            icon: getEntityIcon(entity.name),
            trend: '+12%', // Mock trend for now
            entity: entity.name
          };
          
        } catch (err) {
          console.warn(`⚠️ Error fetching ${entity.name} stats:`, err);
          return {
            label: formatEntityName(entity.name),
            value: '?',
            icon: getEntityIcon(entity.name),
            trend: null,
            entity: entity.name
          };
        }
      });
      
      stats = await Promise.all(statPromises);
      console.log(`✅ Loaded stats for ${stats.length} entities`);
      
    } catch (err: any) {
      console.error(`❌ Error fetching stats:`, err);
      error = err?.message || 'Failed to load statistics';
      stats = [];
    } finally {
      loading = false;
    }
  }
  
  // Helper functions
  function formatEntityName(name: string): string {
    return name.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }
  
  function getEntityIcon(entityName: string): string {
    const iconMap: Record<string, string> = {
      'bike_part': '🚲',
      'store': '🏪',
      'customer': '👤',
      'order': '📦',
      'product': '📦',
      'inventory': '📊',
      'transaction': '💳',
      'user': '👤',
      'account': '💼',
      'project': '📋',
      'task': '✅',
      'issue': '🐛',
      'document': '📄',
      'file': '📎',
      'default': '📊'
    };
    
    return iconMap[entityName.toLowerCase()] || iconMap.default;
  }
  
  // Load stats on component mount
  onMount(() => {
    fetchStats();
  });
  
  // Refresh stats function (can be called externally)
  export function refresh() {
    fetchStats();
  }
</script>

<div class="stats-grid">
  <div class="grid-header">
    <h4>{metadata.title || 'Entity Statistics'}</h4>
  </div>
  
  <div class="stats-container" data-layout={config.layout || 'grid'}>
    {#each stats as stat}
      <div class="stat-card">
        <div class="stat-header">
          <span class="stat-icon">{stat.icon}</span>
          <span class="stat-label">{stat.label}</span>
        </div>
        <div class="stat-value">{stat.value}</div>
        {#if stat.trend}
          <div class="stat-trend positive">
            <span class="trend-indicator">↗</span>
            {stat.trend}
          </div>
        {/if}
      </div>
    {/each}
    
    {#if stats.length === 0}
      <div class="empty-state">
        <div class="empty-icon">📊</div>
        <p>No entities configured for statistics</p>
      </div>
    {/if}
  </div>
  
  {#if error}
    <div class="error-message">
      <strong>Error loading stats:</strong> {error}
    </div>
  {/if}
</div>

<style>
  .stats-grid {
    background: white;
    border-radius: 8px;
    padding: 1.5rem;
    border: 1px solid #e5e7eb;
  }
  
  .grid-header {
    margin-bottom: 1rem;
    border-bottom: 1px solid #f3f4f6;
    padding-bottom: 0.75rem;
  }
  
  .grid-header h4 {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: #1f2937;
  }
  
  .stats-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
  }
  
  .stats-container[data-layout="list"] {
    grid-template-columns: 1fr;
  }
  
  .stat-card {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 1rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    transition: all 0.2s ease-in-out;
  }
  
  .stat-card:hover {
    background: #f3f4f6;
    border-color: #d1d5db;
    transform: translateY(-1px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
  
  .stat-card.loading {
    opacity: 0.7;
  }
  
  .stat-icon {
    font-size: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    background: white;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
  }
  
  .stat-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .stat-count {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1f2937;
    line-height: 1;
  }
  
  .count-skeleton {
    width: 40px;
    height: 24px;
    background: #e5e7eb;
    border-radius: 4px;
    animation: pulse 1.5s ease-in-out infinite;
  }
  
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
  
  .stat-label {
    font-size: 0.875rem;
    color: #6b7280;
    font-weight: 500;
  }
  
  .stat-actions {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .view-btn {
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 0.25rem 0.5rem;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 500;
    transition: background-color 0.2s;
  }
  
  .view-btn:hover {
    background: #2563eb;
  }
  
  .empty-state {
    grid-column: 1 / -1;
    text-align: center;
    padding: 2rem;
    color: #6b7280;
  }
  
  .empty-icon {
    font-size: 3rem;
    margin-bottom: 0.5rem;
  }
  
  .error-message {
    margin-top: 1rem;
    padding: 0.75rem;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 6px;
    color: #dc2626;
    font-size: 0.875rem;
  }
  
  /* Responsive design */
  @media (max-width: 768px) {
    .stats-container {
      grid-template-columns: 1fr;
    }
    
    .stat-card {
      padding: 0.75rem;
    }
    
    .stat-icon {
      width: 40px;
      height: 40px;
      font-size: 1.5rem;
    }
    
    .stat-count {
      font-size: 1.25rem;
    }
  }
</style> 