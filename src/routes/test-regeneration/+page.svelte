<script>
  import ServiceRegenerator from '$lib/components/ServiceRegenerator.svelte';
  import SchemaEvolution from '$lib/components/SchemaEvolution.svelte';
  
  // Mock data for testing
  const mockServiceId = "test-service-123";
  const mockServiceName = "Test Service";
  const mockVersion = 1;
  const mockSchema = "test_schema";
</script>

<div class="test-container">
  <h1>Regeneration Components Test</h1>
  
  <div class="component-section">
    <h2>ServiceRegenerator Component</h2>
    <ServiceRegenerator 
      serviceId={mockServiceId}
      serviceName={mockServiceName}
      currentVersion={mockVersion}
      on:regenerated={(e) => console.log('Regenerated:', e.detail)}
    />
  </div>
  
  <div class="component-section">
    <h2>SchemaEvolution Component</h2>
    <SchemaEvolution serviceId={mockSchema} />
  </div>
</div>

<style>
  .test-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }
  
  .component-section {
    margin-bottom: 3rem;
  }
  
  h1 {
    color: #333;
    margin-bottom: 2rem;
  }
  
  h2 {
    color: #666;
    margin-bottom: 1rem;
  }
</style> 