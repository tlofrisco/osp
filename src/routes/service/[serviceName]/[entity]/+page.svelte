<script lang="ts">
  export let data;
  import { onMount } from 'svelte';

  let formData = {};
  let saving = false;
  let loading = true;
  let error = '';
  let items = [];

  const { serviceName, entityName, manifest } = data;
  const entity = manifest.entities.find(e => e.name.toLowerCase() === entityName.toLowerCase());
  const schema = manifest.schema;
  const columns = Object.entries(entity.attributes || {}).map(([name, type]) => ({ name, type }));

  onMount(async () => {
    try {
      const res = await fetch(`/api/services/${schema}/${entityName}`, {
        credentials: 'include'
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Failed to fetch items');
      items = result.data || [];
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  });

  async function submitForm() {
    saving = true;
    try {
      const res = await fetch(`/api/services/${schema}/${entityName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Submit failed');
      items = [...items, result.data];
      formData = {};
    } catch (err) {
      error = err.message;
    } finally {
      saving = false;
    }
  }
</script>

<main>
  <h2>{entity?.name} - Manage Records</h2>

  {#if columns.length > 0}
    <form on:submit|preventDefault={submitForm}>
      {#each columns as column}
        <label for={column.name}>{column.name}</label>
        <input
          id={column.name}
          type={column.type === 'numeric' ? 'number' : 'text'}
          bind:value={formData[column.name]}
        />
      {/each}
      <button type="submit" disabled={saving}>Add</button>
    </form>
  {:else}
    <p>No fields to display.</p>
  {/if}

  {#if loading}
    <p>Loading items...</p>
  {:else if items.length > 0}
    <table>
      <thead>
        <tr>
          {#each columns as column}
            <th>{column.name}</th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each items as item}
          <tr>
            {#each columns as column}
              <td>{item[column.name]}</td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  {:else}
    <p>No records yet.</p>
  {/if}

  {#if error}<p style="color:red">{error}</p>{/if}
</main>

<style>
  form {
    display: grid;
    gap: 1rem;
    margin-top: 1rem;
  }
  table {
    margin-top: 2rem;
    width: 100%;
    border-collapse: collapse;
  }
  th, td {
    padding: 0.5rem;
    border: 1px solid #ccc;
  }
</style>
