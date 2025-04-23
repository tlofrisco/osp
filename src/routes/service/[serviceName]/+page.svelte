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
  // Destructure the actual properties returned by load
  const { serviceName, service, tables } = data; // 'tables' replaces 'schemaTables', 'service' replaces 'manifest' concept

  // Get schema name from the service record
  const serviceSchema = service?.service_schema; // Access nested property

  // Extract entity details from the blended_model within the service record
  // Assuming blended_model.entities is an object map { EntityName: { attributes, relationships } }
  // Get the name of the first entity found in the blended_model
  const firstEntityName = service?.blended_model?.entities
    ? Object.keys(service.blended_model.entities)[0]
    : undefined;

  // Get the actual entity object using the name
  const entity = firstEntityName
    ? service.blended_model.entities[firstEntityName]
    : undefined;

  // Derive table name and columns from the extracted entity
  const tableName = firstEntityName?.toLowerCase(); // Use entity name for table name
  const columns = entity?.attributes
    ? Object.entries(entity.attributes).map(([key, type]) => ({ name: key, type: String(type) })) // Map attributes to columns, ensure type is string if needed
    : []; // Default to empty array if no attributes

  console.log('[+page.svelte SSR] Derived serviceSchema:', serviceSchema);
  console.log('[+page.svelte SSR] Derived firstEntityName:', firstEntityName);
  console.log('[+page.svelte SSR] Derived entity:', !!entity); // Log if entity object exists
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
      // Use derived serviceSchema and tableName
      const apiUrl = `/api/services/${serviceSchema}/${tableName}`;
      console.log('Submitting to:', apiUrl);
      console.log('Submitting data:', formData);

      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include' // Ensure cookies/auth are sent if needed by API
      });

      // Check if response is JSON before parsing
      const contentType = res.headers.get("content-type");
      let result = {};
       if (contentType && contentType.indexOf("application/json") !== -1) {
           result = await res.json();
       } else {
           result.message = await res.text(); // Get text if not JSON
       }

      if (!res.ok) {
          // Use result.message if available, otherwise use status text
          throw new Error(result.message || `HTTP error! status: ${res.status} ${res.statusText}`);
      }

      formData = {}; // Reset form
      alert('Submitted successfully!'); // Provide feedback

    } catch (err) {
       console.error('Form submission error:', err);
       error = err.message || 'An unexpected error occurred.';
    } finally {
      saving = false;
    }
  }

  // Initialize formData based on columns (useful for reactivity)
  $: {
      const initialFormData = {};
      columns.forEach(col => {
          initialFormData[col.name] = ''; // Or default based on type if needed
      });
      // Only reset if formData is currently empty, to avoid overwriting user input
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
           <!-- Wrap label/input for better layout/styling -->
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

  {#if error}<p style="color:red; margin-top: 1rem;">Error: {error}</p>{/if}

  <section style="margin-top: 2rem; border-top: 1px solid #ccc; padding-top: 1rem;">
      <h3>Detected Tables in Schema '{serviceSchema ?? 'N/A'}' (from RPC - may be empty if RPC failed)</h3>
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
    grid-template-columns: 1fr; /* Stack fields by default */
    gap: 0.75rem; /* Slightly reduced gap */
    margin-top: 1rem;
    max-width: 500px; /* Limit form width */
  }

  /* Style label/input pairs */
  form div {
      display: contents; /* Allow grid layout to apply directly to label/input */
  }

  label {
      grid-column: 1; /* Place label in first column */
      text-align: right;
      padding-right: 0.5rem;
      align-self: center; /* Vertically align label */
      font-weight: bold;
  }

  input {
      grid-column: 2; /* Place input in second column */
      padding: 0.5rem;
      font-size: 1rem;
      border: 1px solid #ccc;
      border-radius: 4px;
  }

   button {
      grid-column: 1 / -1; /* Span across both columns */
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

   /* Adjust grid for wider screens */
   @media (min-width: 600px) {
        form {
             grid-template-columns: auto 1fr; /* Label width auto, input takes rest */
        }
         button {
             grid-column: 2; /* Align button under input on wider screens */
             justify-self: start; /* Align button left */
         }
    }

</style>