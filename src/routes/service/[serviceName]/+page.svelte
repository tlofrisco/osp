<script lang="ts">
  import { onMount } from 'svelte';
  /** @type {import('./$types').PageData} */
  export let data;

  // Log the data received during SSR (will appear in terminal)
  console.log('[+page.svelte SSR] Received data:', data ? 'Data received' : 'Data is null/undefined');
  try {
    console.log('[+page.svelte SSR] stringified data:', JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('[+page.svelte SSR] Error stringifying data:', e);
  }

  // --- MODIFIED LOGIC ---
  const { serviceName, service, tables } = data;

  const serviceSchema = service?.service_schema;

  const firstEntity = service?.blended_model?.entities?.[0];
  const firstEntityName = firstEntity?.name ?? undefined;
  const entity = firstEntity ?? undefined;

  const tableName = firstEntityName?.toLowerCase();
  const columns = firstEntity?.attributes
    ? Object.entries(firstEntity.attributes).map(([key, type]) => ({ name: key, type: String(type) }))
    : [];

  console.log('[+page.svelte SSR] Derived serviceSchema:', serviceSchema);
  console.log('[+page.svelte SSR] Derived firstEntityName:', firstEntityName);
  console.log('[+page.svelte SSR] Derived entity:', !!entity);
  console.log('[+page.svelte SSR] Derived tableName:', tableName);
  console.log('[+page.svelte SSR] Derived columns:', columns);
  // --- END OF MODIFIED LOGIC ---

  let formData = {};
  let saving = false;
  let error = '';

  async function submitForm() {
    if (!tableName || !serviceSchema) {
      error = 'Missing table name or schema information.';
      return;
    }
    saving = true;
    error = '';
    try {
      // 🆕✨ Patch: Auto-generate ID if missing
      if (!formData.id) {
        formData.id = `service_${Date.now()}`;
      }

      const apiUrl = `/api/services/${serviceSchema}/${tableName}`;
      console.log('Submitting to:', apiUrl);
      console.log('Submitting data:', formData);

      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include'
      });

      const contentType = res.headers.get('content-type');
      let result = {};
      if (contentType && contentType.indexOf('application/json') !== -1) {
        result = await res.json();
      } else {
        result.message = await res.text();
      }

      if (!res.ok) {
        throw new Error(result.message || `HTTP error! status: ${res.status} ${res.statusText}`);
      }

      formData = {}; // Reset form
      alert('Submitted successfully!');

    } catch (err) {
      console.error('Form submission error:', err);
      error = err.message || 'An unexpected error occurred.';
    } finally {
      saving = false;
    }
  }

  // Initialize formData based on columns
  $: {
    const initialFormData = {};
    columns.forEach(col => {
      initialFormData[col.name] = '';
    });
    if (Object.keys(formData).length === 0) {
      formData = initialFormData;
    }
  }
</script>

<main>
  <h2>Create Item in: {firstEntityName ?? 'Entity'} (Service: {serviceName})</h2>
  <p>Schema: {serviceSchema ?? 'N/A'}, Target Table: {tableName ?? 'N/A'}</p>

  {#if columns.length > 0}
    <form on:submit|preventDefault={submitForm}>
      {#each columns as column (column.name)}
        <div>
          <label for={column.name}>{column.name} ({String(column.type)})</label>
          {#if column.type === 'numeric' || column.type === 'integer' || column.type === 'float'}
            <input
              id={column.name}
              name={column.name}
              type="number"
              step="any"
              bind:value={formData[column.name]}
              required
            />
          {:else}
            <input
              id={column.name}
              name={column.name}
              type="text"
              bind:value={formData[column.name]}
              required
            />
          {/if}
        </div>
      {/each}
      <button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Submit'}</button>
    </form>
  {:else}
    <p>No columns found for entity '{firstEntityName ?? 'N/A'}' in the service model.</p>
    <p>Check the 'blended_model' structure in the 'services' table.</p>
  {/if}

  {#if error}
    <p style="color:red; margin-top: 1rem;">Error: {error}</p>
  {/if}

  <section style="margin-top: 2rem; border-top: 1px solid #ccc; padding-top: 1rem;">
    <h3>Detected Tables in Schema '{serviceSchema ?? 'N/A'}'</h3>
    {#if tables && tables.length > 0}
      <ul>
        {#each tables as tbl}
          <li>{tbl.table_name}</li>
        {/each}
      </ul>
    {:else}
      <p>No tables detected or RPC call failed (Check server logs for PGRST202).</p>
    {/if}
  </section>
</main>

<style>
  main {
    padding: 1rem;
    font-family: sans-serif;
  }
  form {
    display: grid;
    grid-template-columns: 1fr;
    gap: 0.75rem;
    margin-top: 1rem;
    max-width: 500px;
  }
  form div {
    display: contents;
  }
  label {
    grid-column: 1;
    text-align: right;
    padding-right: 0.5rem;
    align-self: center;
    font-weight: bold;
  }
  input {
    grid-column: 2;
    padding: 0.5rem;
    font-size: 1rem;
    border: 1px solid #ccc;
    border-radius: 4px;
  }
  button {
    grid-column: 1 / -1;
    padding: 0.75rem;
    font-size: 1rem;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    margin-top: 1rem;
  }
  button:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
  button:hover:not(:disabled) {
    background-color: #0056b3;
  }
  @media (min-width: 600px) {
    form {
      grid-template-columns: auto 1fr;
    }
    button {
      grid-column: 2;
      justify-self: start;
    }
  }
</style>
