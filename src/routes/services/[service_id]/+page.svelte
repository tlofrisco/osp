<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { supabase } from '$lib/supabase';

  let serviceId: string = '';
  let service: any = null;
  let spec: string = '';
  let error: string = '';
  let loading = true;

  $: serviceId = $page.params.service_id;

  onMount(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('services')
        .select('*')
        .eq('id', serviceId)
        .single();

      if (fetchError) throw fetchError;

      service = data;
      spec = service.spec;
    } catch (err) {
      console.error('Error loading service:', err);
      error = err.message;
    } finally {
      loading = false;
    }
  });
</script>

<main>
  {#if loading}
    <p>Loading service...</p>
  {:else if error}
    <p style="color: red;">Error: {error}</p>
  {:else if service}
    <h1>Service: {service.prompt}</h1>

    {#if spec}
      <h3>Generated Specification</h3>
      <pre>{spec}</pre>
    {/if}

    <!-- Placeholder for dynamic UI rendering -->
    <p>This is where dynamic forms/tables will appear based on manifest.</p>
  {:else}
    <p>No service found for ID: {serviceId}</p>
  {/if}
</main>

<style>
  main {
    max-width: 900px;
    margin: 20px auto;
    padding: 20px;
    font-family: sans-serif;
  }
  pre {
    background-color: #f4f4f4;
    padding: 15px;
    border: 1px solid #ddd;
    border-radius: 5px;
    overflow-x: auto;
    white-space: pre-wrap;
    word-wrap: break-word;
    font-family: monospace;
  }
  p[style*="color: red"] {
    background-color: #ffebee;
    border: 1px solid #f44336;
    padding: 10px;
    border-radius: 4px;
  }
</style>
