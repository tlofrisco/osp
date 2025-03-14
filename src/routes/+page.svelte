<script>
  let prompt = '';
  let spec = '';
  let tables = [];
  let error = '';
  let loading = false;

  // Call the /api/service endpoint
  async function generateSpec() {
    loading = true;
    error = '';
    spec = '';
    tables = [];

    try {
      const response = await fetch('/api/service', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      spec = data.result;

      // Fetch tables from Supabase (using a public endpoint or admin RPC)
      const tablesResponse = await fetch('/api/tables'); // We'll create this next
      const tablesData = await tablesResponse.json();
      tables = tablesData.tables || [];
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  }

  // Handle form submission
  function handleSubmit(event) {
    event.preventDefault();
    generateSpec();
  }
</script>

<main>
  <h1>SMB Inventory Service Generator</h1>

  <form on:submit={handleSubmit}>
    <label for="prompt">Enter your service prompt:</label>
    <input
      id="prompt"
      type="text"
      bind:value={prompt}
      placeholder="e.g., Create an SMB inventory service"
      disabled={loading}
    />
    <button type="submit" disabled={loading}>
      {loading ? 'Generating...' : 'Generate'}
    </button>
  </form>

  {#if error}
    <div class="error">{error}</div>
  {/if}

  {#if spec}
    <section>
      <h2>Generated Specification</h2>
      <pre>{spec}</pre>
    </section>
  {/if}

  {#if tables.length > 0}
    <section>
      <h2>Supabase Tables</h2>
      <ul>
        {#each tables as table}
          <li>{table.table_name}</li>
        {/each}
      </ul>
    </section>
  {/if}
</main>

<style>
  main {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
    font-family: Arial, sans-serif;
  }
  h1 {
    color: #333;
  }
  form {
    margin: 20px 0;
  }
  label {
    display: block;
    margin-bottom: 5px;
  }
  input {
    width: 100%;
    padding: 8px;
    margin-bottom: 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
  }
  button {
    padding: 10px 20px;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  button:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
  .error {
    color: red;
    margin: 10px 0;
  }
  pre {
    background: #f5f5f5;
    padding: 15px;
    border-radius: 4px;
    white-space: pre-wrap;
    word-wrap: break-word;
  }
  ul {
    list-style: none;
    padding: 0;
  }
  li {
    padding: 5px 0;
    border-bottom: 1px solid #eee;
  }
</style>