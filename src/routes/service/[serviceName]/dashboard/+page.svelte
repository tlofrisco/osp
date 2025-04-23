<!-- File: src/routes/service/[serviceName]/dashboard/+page.svelte -->

<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { supabase } from '$lib/supabase';
  import { goto } from '$app/navigation';

  let serviceName = '';
  let model = null;
  let error = '';

  $: serviceName = $page.params.serviceName;

  async function loadServiceModel() {
    try {
      const { data, error: fetchError } = await supabase
        .from('services')
        .select('blended_model')
        .eq('service_schema', serviceName)
        .single();

      if (fetchError) throw fetchError;
      model = data.blended_model;
    } catch (err) {
      console.error('Error loading service model:', err);
      error = 'Failed to load service. Redirecting...';
      setTimeout(() => goto('/'), 3000);
    }
  }

  onMount(loadServiceModel);
</script>

{#if error}
  <p style="color: red;">{error}</p>
{:else if !model}
  <p>Loading service model...</p>
{:else}
  <h2>Service Runtime: {model.service_type ?? serviceName}</h2>
  <p>This is a placeholder for dynamic UI generated from the manifest.</p>

  <pre>{JSON.stringify(model, null, 2)}</pre>
{/if}
