<script lang="ts">
  export let config: any = {};
  export let serviceSchema: string = '';
  export let entityName: string = '';
</script>

<div class="error-component">
  <div class="icon">💥</div>
  <h3>Component Error</h3>
  <p>Failed to load component "{config.id || 'unknown'}"</p>
  {#if config.metadata?.error}
    <p class="error-message">{config.metadata.error}</p>
  {/if}
  <details>
    <summary>Error Details</summary>
    <pre>{JSON.stringify(config, null, 2)}</pre>
  </details>
</div>

<style>
  .error-component {
    padding: 2rem;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 8px;
    text-align: center;
    color: #dc2626;
  }
  
  .icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }
  
  h3 {
    margin: 0 0 0.5rem 0;
    color: #b91c1c;
  }
  
  p {
    margin: 0 0 0.5rem 0;
  }
  
  .error-message {
    font-family: monospace;
    background: #fee2e2;
    padding: 0.5rem;
    border-radius: 4px;
    font-size: 0.875rem;
  }
  
  details {
    text-align: left;
    background: #fee2e2;
    border-radius: 4px;
    padding: 0.5rem;
    margin-top: 1rem;
  }
  
  pre {
    font-size: 0.75rem;
    overflow-x: auto;
    margin: 0.5rem 0 0 0;
  }
</style> 