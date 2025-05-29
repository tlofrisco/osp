<script lang="ts">
  export let config: any = {};
  export let serviceSchema: string = '';
  export let entityName: string = '';
</script>

<div class="unknown-component">
  <div class="icon">❓</div>
  <h3>Unknown Component</h3>
  <p>Component type "{config.type || 'unknown'}" is not available.</p>
  <details>
    <summary>Component Details</summary>
    <pre>{JSON.stringify(config, null, 2)}</pre>
  </details>
</div>

<style>
  .unknown-component {
    padding: 2rem;
    background: #fffbeb;
    border: 1px solid #fde68a;
    border-radius: 8px;
    text-align: center;
    color: #d97706;
  }
  
  .icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }
  
  h3 {
    margin: 0 0 0.5rem 0;
    color: #b45309;
  }
  
  p {
    margin: 0 0 1rem 0;
  }
  
  details {
    text-align: left;
    background: #fef3c7;
    border-radius: 4px;
    padding: 0.5rem;
  }
  
  pre {
    font-size: 0.75rem;
    overflow-x: auto;
    margin: 0.5rem 0 0 0;
  }
</style> 