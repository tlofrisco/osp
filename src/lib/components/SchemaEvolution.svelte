<script lang="ts">
  import { onMount } from 'svelte';
  
  export let serviceId: string;
  
  interface SchemaChange {
    type: 'field_added' | 'field_removed' | 'field_modified' | 'entity_added' | 'entity_removed';
    entity: string;
    field?: string;
    details?: any;
  }
  
  interface SchemaEvolution {
    id: string;
    version: number;
    changes: SchemaChange[];
    applied_at: string;
    created_at: string;
  }
  
  let evolutionHistory: SchemaEvolution[] = [];
  let loading = true;
  let error: string | null = null;
  
  onMount(async () => {
    try {
      // Note: serviceId here is actually the schema name
      const response = await fetch(`/api/services/${serviceId}/schema-evolution`);
      if (!response.ok) {
        // For now, just show empty state if endpoint fails
        console.warn('Schema evolution endpoint not found, showing empty state');
        evolutionHistory = [];
      } else {
        const data = await response.json();
        evolutionHistory = data.evolution || [];
      }
    } catch (err) {
      console.error('Failed to load schema evolution:', err);
      // Don't show error, just show empty state
      evolutionHistory = [];
    } finally {
      loading = false;
    }
  });
  
  function getChangeIcon(type: string) {
    switch (type) {
      case 'field_added':
      case 'entity_added':
        return '➕';
      case 'field_removed':
      case 'entity_removed':
        return '➖';
      case 'field_modified':
        return '✏️';
      default:
        return '🗄️';
    }
  }
  
  function getChangeBadgeClass(type: string) {
    if (type.includes('added')) return 'badge-success';
    if (type.includes('removed')) return 'badge-error';
    return 'badge-warning';
  }
  
  function formatChangeType(type: string) {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }
  
  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString();
  }
</script>

<div class="evolution-card">
  <div class="card-header">
    <h3 class="card-title">
      <span class="icon">🌿</span>
      Schema Evolution History
    </h3>
    <p class="card-description">
      Track changes to your service schema over time
    </p>
  </div>
  
  <div class="card-content">
    {#if loading}
      <div class="loading-container">
        <div class="spinner">⟳</div>
      </div>
    {:else if error}
      <div class="empty-state">
        {error}
      </div>
    {:else if evolutionHistory.length === 0}
      <div class="empty-state">
        No schema changes recorded yet
      </div>
    {:else}
      <div class="evolution-list">
        {#each evolutionHistory as evolution}
          <div class="evolution-item">
            <div class="evolution-header">
              <div class="evolution-meta">
                <span class="version-badge">v{evolution.version}</span>
                <span class="evolution-date">
                  {formatDate(evolution.applied_at)}
                </span>
              </div>
              <span class="change-count">
                {evolution.changes.length} change{evolution.changes.length !== 1 ? 's' : ''}
              </span>
            </div>
            
            <div class="changes-list">
              {#each evolution.changes as change}
                <div class="change-item">
                  <span class="change-icon">{getChangeIcon(change.type)}</span>
                  <div class="change-details">
                    <span class="badge {getChangeBadgeClass(change.type)}">
                      {formatChangeType(change.type)}
                    </span>
                    <span class="entity-name">{change.entity}</span>
                    {#if change.field}
                      <span class="field-separator">.</span>
                      <span class="field-name">{change.field}</span>
                    {/if}
                    {#if change.details?.type}
                      <span class="field-type">
                        ({change.details.type})
                      </span>
                    {/if}
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .evolution-card {
    background: var(--surface-color, #ffffff);
    border: 1px solid var(--border-color, #e5e7eb);
    border-radius: var(--border-radius, 8px);
    box-shadow: var(--shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05));
    width: 100%;
  }
  
  .card-header {
    padding: var(--spacing-lg, 24px);
    border-bottom: 1px solid var(--border-color, #e5e7eb);
  }
  
  .card-title {
    font-size: var(--font-size-lg, 18px);
    font-weight: 600;
    color: var(--text-primary, #1f2937);
    margin: 0 0 var(--spacing-sm, 8px) 0;
    display: flex;
    align-items: center;
    gap: var(--spacing-sm, 8px);
  }
  
  .card-description {
    font-size: var(--font-size-sm, 14px);
    color: var(--text-secondary, #6b7280);
    margin: 0;
  }
  
  .card-content {
    padding: var(--spacing-lg, 24px);
  }
  
  .loading-container {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-xl, 32px) 0;
  }
  
  .spinner {
    font-size: var(--font-size-xl, 32px);
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  .empty-state {
    text-align: center;
    padding: var(--spacing-xl, 32px) 0;
    color: var(--text-secondary, #6b7280);
    font-size: var(--font-size-sm, 14px);
  }
  
  .evolution-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md, 16px);
  }
  
  .evolution-item {
    border: 1px solid var(--border-color, #e5e7eb);
    border-radius: var(--border-radius-sm, 6px);
    padding: var(--spacing-md, 16px);
  }
  
  .evolution-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--spacing-md, 12px);
  }
  
  .evolution-meta {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm, 8px);
  }
  
  .version-badge {
    background: var(--bg-secondary, #f3f4f6);
    color: var(--text-primary, #1f2937);
    padding: var(--spacing-xs, 4px) var(--spacing-sm, 8px);
    border-radius: var(--border-radius-sm, 4px);
    font-size: var(--font-size-xs, 12px);
    font-weight: 500;
    border: 1px solid var(--border-color, #e5e7eb);
  }
  
  .evolution-date {
    font-size: var(--font-size-sm, 14px);
    color: var(--text-secondary, #6b7280);
  }
  
  .change-count {
    font-size: var(--font-size-sm, 14px);
    font-weight: 500;
    color: var(--text-primary, #1f2937);
  }
  
  .changes-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm, 8px);
  }
  
  .change-item {
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-sm, 8px);
    font-size: var(--font-size-sm, 14px);
  }
  
  .change-icon {
    font-size: var(--font-size-base, 16px);
    margin-top: 2px;
  }
  
  .change-details {
    flex: 1;
    display: flex;
    align-items: center;
    gap: var(--spacing-xs, 4px);
    flex-wrap: wrap;
  }
  
  .badge {
    padding: 2px var(--spacing-sm, 8px);
    border-radius: var(--border-radius-sm, 4px);
    font-size: var(--font-size-xs, 12px);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.025em;
  }
  
  .badge-success {
    background: #dcfce7;
    color: #16a34a;
    border: 1px solid #bbf7d0;
  }
  
  .badge-error {
    background: #fee2e2;
    color: #dc2626;
    border: 1px solid #fecaca;
  }
  
  .badge-warning {
    background: #fef3c7;
    color: #d97706;
    border: 1px solid #fde68a;
  }
  
  .entity-name {
    font-weight: 500;
    color: var(--text-primary, #1f2937);
  }
  
  .field-separator {
    color: var(--text-secondary, #6b7280);
  }
  
  .field-name {
    font-family: monospace;
    font-size: var(--font-size-xs, 12px);
    color: var(--text-primary, #1f2937);
  }
  
  .field-type {
    color: var(--text-secondary, #6b7280);
    margin-left: var(--spacing-sm, 8px);
  }
  
    .icon {
    font-size: var(--font-size-lg, 20px);
  }
</style> 