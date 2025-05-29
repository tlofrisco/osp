<script lang="ts">
  import { onMount } from 'svelte';
  
  export let config: any;
  export let columns: any[] = [];
  export let metadata: any = {};
  export let entityName: string = '';
  export let serviceSchema: string = '';
  
  let data: any[] = [];
  let loading = true;
  let error = '';
  
  // Data fetching function
  async function fetchData() {
    if (!serviceSchema || !entityName) {
      error = 'Missing schema or entity name';
      loading = false;
      return;
    }
    
    loading = true;
    error = '';
    
    try {
      console.log(`🔍 Fetching data for ${serviceSchema}.${entityName}`);
      
      const apiUrl = `/api/services/${serviceSchema}/${entityName}`;
      const response = await fetch(apiUrl);
      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      data = result.data || [];
      console.log(`✅ Loaded ${data.length} ${entityName} records`);
      
    } catch (err: any) {
      console.error(`❌ Error fetching ${entityName} data:`, err);
      error = err?.message || 'Failed to load data';
      data = [];
    } finally {
      loading = false;
    }
  }
  
  // Load data on component mount
  onMount(() => {
    fetchData();
  });
  
  // Refresh data function (can be called externally)
  export function refresh() {
    fetchData();
  }
  
  function handleAction(action: string, item: any) {
    console.log(`📋 DataTable action: ${action}`, item);
  }
</script>

<div class="data-table">
  <div class="table-header">
    <h4>{metadata.title || `${entityName} Records`}</h4>
    <div class="table-actions">
      <button class="btn btn-primary">Add New</button>
    </div>
  </div>
  
  {#if loading}
    <div class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading data...</p>
    </div>
  {:else if error}
    <div class="error-state">
      <p>Error: {error}</p>
    </div>
  {:else}
    <div class="table-container">
      <table class="table">
        <thead>
          <tr>
            {#each columns as column (column.key)}
              <th>{column.label || column.key}</th>
            {/each}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each data as item (item.id)}
            <tr>
              {#each columns as column (column.key)}
                <td>
                  {item[column.key] || '-'}
                </td>
              {/each}
              <td class="actions-cell">
                {#if config.actions?.includes('view')}
                  <button class="action-btn view" on:click={() => handleAction('view', item)}>
                    👁️
                  </button>
                {/if}
                {#if config.actions?.includes('edit')}
                  <button class="action-btn edit" on:click={() => handleAction('edit', item)}>
                    ✏️
                  </button>
                {/if}
                {#if config.actions?.includes('delete')}
                  <button class="action-btn delete" on:click={() => handleAction('delete', item)}>
                    🗑️
                  </button>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
      
      {#if data.length === 0}
        <div class="empty-state">
          <p>No records found</p>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .data-table {
    background: white;
    border-radius: 8px;
    padding: 1.5rem;
    border: 1px solid #e5e7eb;
  }
  
  .table-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    border-bottom: 1px solid #f3f4f6;
    padding-bottom: 0.75rem;
  }
  
  .table-header h4 {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: #1f2937;
  }
  
  .table-actions {
    display: flex;
    gap: 0.5rem;
  }
  
  .btn {
    padding: 0.5rem 1rem;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    border: 1px solid transparent;
    transition: all 0.2s;
  }
  
  .btn-primary {
    background: #3b82f6;
    color: white;
    border-color: #3b82f6;
  }
  
  .btn-primary:hover {
    background: #2563eb;
    border-color: #2563eb;
  }
  
  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2rem;
    gap: 1rem;
  }
  
  .loading-spinner {
    width: 24px;
    height: 24px;
    border: 2px solid #e2e8f0;
    border-top: 2px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .error-state {
    padding: 2rem;
    text-align: center;
    color: #dc2626;
  }
  
  .table-container {
    overflow-x: auto;
  }
  
  .table {
    width: 100%;
    border-collapse: collapse;
  }
  
  .table th,
  .table td {
    padding: 0.75rem;
    text-align: left;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .table th {
    background: #f9fafb;
    font-weight: 600;
    color: #374151;
    font-size: 0.875rem;
  }
  
  .table td {
    font-size: 0.875rem;
    color: #1f2937;
  }
  
  .table tbody tr:hover {
    background: #f9fafb;
  }
  
  .actions-cell {
    width: 120px;
  }
  
  .action-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.25rem;
    margin: 0 0.125rem;
    border-radius: 4px;
    font-size: 0.875rem;
    transition: background-color 0.2s;
  }
  
  .action-btn:hover {
    background: #f3f4f6;
  }
  
  .action-btn.delete:hover {
    background: #fef2f2;
  }
  
  .empty-state {
    text-align: center;
    padding: 2rem;
    color: #6b7280;
  }
</style> 