<script lang="ts">
  export let data;

  const { serviceName, manifest, schemaTables } = data;

  const tables = manifest.entities || [];
</script>

<main>
  <h2>🧩 Schema View for Service: {serviceName}</h2>

  {#if tables.length > 0}
    {#each tables as table}
      <section>
        <h3>📘 Table: {table.name}</h3>
        <ul>
          {#each Object.entries(table.attributes) as [attrName, attrType]}
            <li><strong>{attrName}</strong>: <code>{attrType}</code></li>
          {/each}
        </ul>

        {#if table.relationships}
          <details>
            <summary>🔗 Relationships</summary>
            <ul>
              {#each Object.entries(table.relationships) as [relName, relType]}
                <li><strong>{relName}</strong>: <code>{relType}</code></li>
              {/each}
            </ul>
          </details>
        {/if}
      </section>
    {/each}
  {:else}
    <p>No entity data found in manifest.</p>
  {/if}
</main>

<style>
  main {
    max-width: 900px;
    margin: 0 auto;
    padding: 2rem;
    font-family: sans-serif;
  }

  h2 {
    margin-bottom: 2rem;
  }

  section {
    margin-bottom: 2rem;
    border: 1px solid #ccc;
    padding: 1rem;
    border-radius: 5px;
    background: #f9f9f9;
  }

  h3 {
    margin-bottom: 0.5rem;
  }

  code {
    background: #eee;
    padding: 0.2rem 0.4rem;
    border-radius: 4px;
    font-family: monospace;
  }

  summary {
    cursor: pointer;
    margin-top: 1rem;
    font-weight: bold;
  }
</style>
