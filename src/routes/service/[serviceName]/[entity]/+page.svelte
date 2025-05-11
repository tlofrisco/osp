<script lang="ts">
  export let data;
  import { onMount } from 'svelte';

  let formData = {};
  let saving = false;
  let loading = true;
  let error = '';
  let items = [];

  const { serviceName, entityName, schema, columns, manifest } = data;

  // 🧠 Source of truth: Use Supabase column names exactly
  let inputs = columns?.map((col) => ({
    name: col.name,
    type: col.type
  }));

  // 🛑 Fallback if columns are empty (i.e., no introspection worked)
  if ((!inputs || inputs.length === 0) && manifest) {
    const fallbackEntity = manifest.entities.find(
      (e) => e.name.toLowerCase() === entityName.toLowerCase()
    );
    if (fallbackEntity?.attributes) {
      inputs = Object.entries(fallbackEntity.attributes).map(([name, type]) => ({
        name,
        type
      }));
    }
  }

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

  function coerceForPost(data: Record<string, any>, fields: { name: string; type: string }[]) {
    const result: Record<string, any> = {};
    for (const field of fields) {
      let val = data[field.name];
      if (val === undefined || val === null || val === '') continue;

      switch (field.type.toLowerCase()) {
        case 'numeric':
        case 'number':
        case 'int':
        case 'integer':
          result[field.name] = parseFloat(val);
          break;
        case 'boolean':
          result[field.name] = val === 'true' || val === true;
          break;
        case 'date':
        case 'timestamp with time zone':
        case 'timestamptz':
          result[field.name] = new Date(val).toISOString();
          break;
        default:
          result[field.name] = val;
      }
    }
    return result;
  }

  async function submitForm() {
    saving = true;
    try {
      const coercedData = coerceForPost(formData, inputs);
      const res = await fetch(`/api/services/${schema}/${entityName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(coercedData)
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
  <h2>{entityName} - Manage Records</h2>

  {#if inputs?.length > 0}
    <form on:submit|preventDefault={submitForm}>
      {#each inputs as input}
        <label for={input.name}>{input.name}</label>
        <input
          id={input.name}
          type={
            input.type.includes('int') || input.type.includes('numeric') || input.type === 'number'
              ? 'number'
              : input.type.includes('date') || input.type === 'timestamptz'
              ? 'date'
              : 'text'
          }
          bind:value={formData[input.name]}
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
          {#each inputs as input}
            <th>{input.name}</th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each items as item}
          <tr>
            {#each inputs as input}
              <td>{item[input.name]}</td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  {:else}
    <p>No records yet.</p>
  {/if}

  {#if error}
    <p style="color:red">{error}</p>
  {/if}
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
  th,
  td {
    padding: 0.5rem;
    border: 1px solid #ccc;
  }
</style>
