<script>
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';

  let user = null;
  let email = '';
  let password = '';
  let step = 1;
  let serviceDraft = { problem: '', requirements: '', frameworks: ['TMForumSID', 'ARTS'] };
  let inputValue = '';
  let spec = '';
  let tables = [];
  let parts = [];
  let suppliers = [];
  let stores = [];
  let error = '';
  let loading = false;
  let serviceGenerated = false;
  let partTableName = '';
  let partColumns = [];
  let formData = { itemid: '', itemname: '', description: '', quantity: 0, price: 0, supplierid: '' };
  let newSupplier = { supplierid: '', suppliername: '', contactinfo: '', address: '' };
  let newStore = { storeid: '', storename: '', location: '', manager: '' };
  let editingItem = null;
  let sortColumn = 'quantity';
  let sortDirection = 'asc';
  let filterCategory = '';

  $: console.log('Current formData:', formData);
  $: console.log('Current editingItem state:', editingItem);

  onMount(async () => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error('onMount getSession error:', sessionError);
      return;
    }
    console.log('onMount session:', session);
    if (session) {
      user = session.user;
      console.log('User validated:', user.email);
      // Force session into cookies
      await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token
      });
      console.log('Session forced into cookies. Cookies now:', document.cookie);
    } else {
      console.log('No session found on mount');
    }
    const input = document.getElementById('itemid');
    if (input) {
      input.addEventListener('input', (e) => console.log('Native Item ID input:', e.target.value));
    }
  });

  async function signUp() {
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: 'http://localhost:5173' }
    });
    if (authError) {
      error = authError.message;
    } else {
      error = 'Check your email to confirm signup.';
    }
  }

  async function signIn() {
    console.log('Starting signIn with:', { email, password: '[hidden]' });
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (authError) {
      error = authError.message;
      console.error('Sign-in error:', authError);
    } else {
      user = data.user;
      console.log('Sign-in successful. User:', data.user.email);
      console.log('Session:', data.session);
      console.log('Cookies immediately after signIn:', document.cookie);
      document.cookie = "testcookie=works;path=/;max-age=3600";
      console.log('Test cookie set. Cookies now:', document.cookie);
      await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token
      });
      console.log('Session set manually. Cookies now:', document.cookie);
      const { data: refreshedSession, error: refreshError } = await supabase.auth.getSession();
      if (refreshError) console.error('Refresh error:', refreshError);
      console.log('Refreshed session:', refreshedSession);
      console.log('Cookies after refresh:', document.cookie);
    }
  }

  async function signOut() {
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      error = signOutError.message;
    } else {
      user = null;
      reset();
    }
  }

  function reset() {
    step = 1;
    serviceDraft.problem = '';
    serviceDraft.requirements = '';
    serviceDraft.frameworks = ['TMForumSID', 'ARTS'];
    inputValue = '';
    spec = '';
    tables = [];
    parts = [];
    suppliers = [];
    stores = [];
    error = '';
    loading = false;
    serviceGenerated = false;
    partTableName = '';
    partColumns = [];
    formData.itemid = '';
    formData.itemname = '';
    formData.description = '';
    formData.quantity = 0;
    formData.price = 0;
    formData.supplierid = '';
    newSupplier = { supplierid: '', suppliername: '', contactinfo: '', address: '' };
    newStore = { storeid: '', storename: '', location: '', manager: '' };
    editingItem = null;
    console.log('Application state reset.');
  }

  const questions = {
    1: 'What are you looking to build?',
    2: 'Any specific requirements?'
  };

  function handleGenInput(event) {
    inputValue = event.target.value;
  }

  async function fetchTables() {
    try {
      console.log('Fetching tables...');
      const response = await fetch('/api/tables', {
        credentials: 'include'
      });
      const tablesData = await response.json();
      if (!response.ok) throw new Error(tablesData.error || `HTTP error ${response.status}`);
      tables = tablesData.tables || [];
      console.log('Tables in public schema:', tables);
    } catch (err) {
      console.error('Error fetching tables:', err);
      error = 'Failed to fetch tables: ' + err.message;
    }
  }

  async function fetchServiceModel() {
    try {
      console.log('Fetching service model...');
      const response = await fetch('/api/services/smb_inventory/model', {
        credentials: 'include'
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || `HTTP error ${response.status}`);

      const blendedModel = result.blended_model;
      const entities = blendedModel.entities && !Array.isArray(blendedModel.entities)
        ? Object.entries(blendedModel.entities).map(([name, details]) => ({ name, ...details }))
        : blendedModel.entities || [];

      const partsEntity = entities.find(entity => entity.name.toLowerCase() === 'inventoryitem') || 
                         entities.find(entity => 
                           ['part', 'item', 'product'].includes(entity.name.toLowerCase()) &&
                           entity.attributes && 
                           Object.keys(entity.attributes).some(attr => ['name', 'quantity', 'price'].includes(attr.toLowerCase()))
                         );

      if (partsEntity) {
        partTableName = partsEntity.name.toLowerCase();
        partColumns = [
          { name: 'id', display: 'ID' },
          ...Object.entries(partsEntity.attributes).map(([attr, type]) => ({
            name: attr,
            display: attr.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            type: type
          })),
          ...Object.keys(partsEntity.relationships || {}).map(rel => ({
            name: rel,
            display: rel.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) + ' ID',
            type: 'foreignKey'
          }))
        ];
      } else {
        console.warn("No 'inventoryitem' or similar table found. Using fallback.");
        partTableName = 'inventoryitem';
        partColumns = [
          { name: 'id', display: 'ID' },
          { name: 'itemid', display: 'Item ID' },
          { name: 'itemname', display: 'Item Name' },
          { name: 'description', display: 'Description' },
          { name: 'quantity', display: 'Quantity' },
          { name: 'price', display: 'Price' },
          { name: 'supplierid', display: 'Supplier ID' }
        ];
      }

      console.log('Fetched service model, partTableName:', partTableName, 'partColumns:', partColumns);
    } catch (err) {
      console.error('Error fetching service model:', err);
      error = 'Failed to fetch service model: ' + err.message;
      partTableName = '';
      partColumns = [];
    }
  }

  async function fetchParts() {
    if (!partTableName) {
      console.log('Skipping fetchParts: partTableName not set.');
      parts = [];
      return;
    }
    try {
      console.log(`Fetching parts from ${partTableName}...`);
      const response = await fetch(`/api/services/smb_inventory/${partTableName}`, {
        credentials: 'include'
      });
      console.log('Parts fetch response status:', response.status);
      const result = await response.json();
      console.log('Parts fetch result:', result);
      if (!response.ok) {
        throw new Error(result.message || `HTTP error ${response.status}`);
      }
      parts = result.data || [];
      console.log('Fetched parts:', parts);
      error = '';
    } catch (err) {
      console.error('Error fetching parts:', err);
      error = `Failed to fetch parts from ${partTableName}: ${err.message}`;
      parts = [];
    }
  }

  async function fetchSuppliers() {
    try {
      console.log('Fetching suppliers...');
      const response = await fetch('/api/services/smb_inventory/supplier', {
        credentials: 'include'
      });
      console.log('Supplier fetch response status:', response.status);
      const result = await response.json();
      console.log('Supplier fetch result:', result);
      if (!response.ok) {
        throw new Error(result.message || `HTTP error ${response.status}`);
      }
      suppliers = result.data || [];
      console.log('Fetched suppliers:', suppliers);
    } catch (err) {
      console.error('Error fetching suppliers:', err);
      error = 'Failed to fetch suppliers: ' + err.message;
      suppliers = [];
    }
  }

  async function fetchStores() {
    try {
      console.log('Fetching stores...');
      const response = await fetch('/api/services/smb_inventory/store', {
        credentials: 'include'
      });
      console.log('Store fetch response status:', response.status);
      const result = await response.json();
      console.log('Store fetch result:', result);
      if (!response.ok) {
        throw new Error(result.message || `HTTP error ${response.status}`);
      }
      stores = result.data || [];
      console.log('Fetched stores:', stores);
    } catch (err) {
      console.error('Error fetching stores:', err);
      error = 'Failed to fetch stores: ' + err.message;
      stores = [];
    }
  }

  async function generateSpec() {
    if (!user) {
      error = 'Please sign in to generate a service.';
      return;
    }
    loading = true;
    error = '';
    spec = '';
    tables = [];
    parts = [];
    suppliers = [];
    stores = [];
    partTableName = '';
    partColumns = [];
    serviceGenerated = false;

    if (step === 2) serviceDraft.requirements = inputValue;

    try {
      console.log('Generating spec...');
      const response = await fetch('/api/osp/service', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(serviceDraft)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `HTTP error! Status: ${response.status}` }));
        throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      spec = data.spec;
      serviceGenerated = true;
      console.log('Service spec generated successfully.');

      await fetchServiceModel();
      await fetchParts();
      await fetchSuppliers();
      await fetchStores();
    } catch (err) {
      console.error('Error generating spec:', err);
      error = err.message;
      serviceGenerated = false;
    } finally {
      loading = false;
    }
  }

  async function addInventoryItem() {
    if (!partTableName) {
      error = "Cannot add item: table name not determined.";
      return;
    }
    try {
      console.log(`Adding inventory item to ${partTableName}...`);
      const payload = { ...formData };
      payload.quantity = Number(payload.quantity);
      payload.price = Number(payload.price);

      const response = await fetch(`/api/services/smb_inventory/${partTableName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || `HTTP error ${response.status}`);
      }
      parts = [...parts, result.data];
      formData.itemid = '';
      formData.itemname = '';
      formData.description = '';
      formData.quantity = 0;
      formData.price = 0;
      formData.supplierid = '';
      console.log('Added inventory item:', result.data);
      error = '';
    } catch (err) {
      console.error('Error adding inventory item:', err);
      error = `Failed to add inventory item: ${err.message}`;
    }
  }

  async function updateInventoryItem() {
    if (!partTableName || !editingItem?.id) {
      error = "Cannot update item: table name or item ID missing.";
      return;
    }
    try {
      console.log(`Updating inventory item ${editingItem.id} in ${partTableName}...`);
      const payload = { ...formData, id: editingItem.id };
      payload.quantity = Number(payload.quantity);
      payload.price = Number(payload.price);

      const response = await fetch(`/api/services/smb_inventory/${partTableName}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || `HTTP error ${response.status}`);
      }
      parts = parts.map(item => (item.id === result.data.id ? result.data : item));
      editingItem = null;
      formData.itemid = '';
      formData.itemname = '';
      formData.description = '';
      formData.quantity = 0;
      formData.price = 0;
      formData.supplierid = '';
      console.log('Updated inventory item:', result.data);
      error = '';
    } catch (err) {
      console.error('Error updating inventory item:', err);
      error = `Failed to update inventory item: ${err.message}`;
    }
  }

  async function deleteInventoryItem(id) {
    if (!partTableName) {
      error = "Cannot delete item: table name not determined.";
      return;
    }
    if (!confirm(`Are you sure you want to delete item ${id}?`)) {
      return;
    }
    try {
      console.log(`Deleting inventory item ${id} from ${partTableName}...`);
      const response = await fetch(`/api/services/smb_inventory/${partTableName}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ id })
      });

      const result = await response.json();
      if (!response.ok && response.status !== 204) {
        throw new Error(result.message || `HTTP error ${response.status}`);
      }
      parts = parts.filter(item => item.id !== id);
      console.log('Deleted inventory item with id:', id);
      error = '';
    } catch (err) {
      console.error('Error deleting inventory item:', err);
      error = `Failed to delete inventory item: ${err.message}`;
    }
  }

  function editInventoryItem(item) {
    console.log('Editing item:', item);
    editingItem = { id: item.id };
    formData.itemid = item.itemid || item.partid || item.id || '';
    formData.itemname = item.itemname || item.partname || item.name || '';
    formData.description = item.description || '';
    formData.quantity = Number(item.quantity) || 0;
    formData.price = Number(item.price) || 0;
    formData.supplierid = item.supplierid || item.supplier_id || item.supplier || '';
    console.log('Form data populated for editing:', formData);
  }

  function cancelEdit() {
    editingItem = null;
    formData.itemid = '';
    formData.itemname = '';
    formData.description = '';
    formData.quantity = 0;
    formData.price = 0;
    formData.supplierid = '';
    console.log('Cancelled edit, form reset.');
  }

  function sortParts(column) {
    if (sortColumn === column) {
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      sortColumn = column;
      sortDirection = 'asc';
    }
    parts = [...parts].sort((a, b) => {
      let aValue = a[column];
      let bValue = b[column];
      if (typeof aValue === 'string' && !isNaN(parseFloat(aValue)) && typeof bValue === 'string' && !isNaN(parseFloat(bValue))) {
        aValue = parseFloat(aValue);
        bValue = parseFloat(bValue);
      } else if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = String(bValue ?? '').toLowerCase();
      } else if (typeof aValue === 'number') {
        bValue = Number(bValue ?? 0);
      }
      if (aValue == null && bValue != null) return sortDirection === 'asc' ? -1 : 1;
      if (aValue != null && bValue == null) return sortDirection === 'asc' ? 1 : -1;
      if (aValue == null && bValue == null) return 0;
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  function filterParts() {
    if (!filterCategory) return parts;
    if (parts.length > 0 && parts[0].hasOwnProperty('category')) {
      return parts.filter(part => part.category === filterCategory);
    }
    return parts;
  }
</script>

<!-- HTML and <style> sections unchanged from your original -->
<main>
  {#if !user}
    <h1>Sign In / Sign Up</h1>
    <form on:submit|preventDefault={signIn}>
      <label for="email">Email</label>
      <input id="email" type="email" bind:value={email} autocomplete="email" required />
      <label for="password">Password</label>
      <input id="password" type="password" bind:value={password} autocomplete="current-password" required />
      <button type="submit">Sign In</button>
      <button type="button" on:click={signUp}>Sign Up</button>
    </form>
     {#if error}<p style="color: red;">{error}</p>{/if}
  {:else}
    <h1>One Service Platform Builder</h1>
    <p>Welcome, {user.email} <button on:click={signOut}>Sign Out</button></p>

    {#if !serviceGenerated && !loading}
      <h2>Step {step}: {questions[step]}</h2>
      <form on:submit|preventDefault={() => {
        if (step === 1) {
          serviceDraft.problem = inputValue;
          step = 2;
          inputValue = ''; // Clear input for next step
          error = ''; // Clear previous errors
        } else {
          serviceDraft.requirements = inputValue; // Capture requirements before generating
          generateSpec();
        }
      }}>
        <input type="text" bind:value={inputValue} on:input={handleGenInput} required placeholder={step === 1 ? "e.g., An SMB inventory system" : "e.g., Track parts, suppliers, and stock levels"} />
        <button type="submit" disabled={loading}>{step === 1 ? 'Next' : 'Generate Service'}</button>
      </form>
    {/if}

    {#if loading}
      <p>Loading... Generating service and fetching data...</p>
    {/if}

    {#if error && !loading}
      <p style="color: red;">Error: {error}</p>
    {/if}

    {#if serviceGenerated && !loading}
      <h2>Service: SMB Inventory (Example)</h2>

      {#if spec}
        <h3>Generated Specification</h3>
        <pre>{spec}</pre>
      {/if}

      {#if tables.length > 0}
        <h3>Detected Tables in `public`</h3>
        <ul>
          {#each tables as table}<li>{table.table_schema}.{table.table_name}</li>{/each}
        </ul>
      {/if}

      <section>
        <h2>{editingItem ? `Edit Item (ID: ${editingItem.id})` : 'Add New Inventory Item'}</h2>
        <form on:submit|preventDefault={editingItem ? updateInventoryItem : addInventoryItem}>
          <label for="itemid">Item/Part ID (SKU)</label>
          <input
            id="itemid"
            type="text"
            bind:value={formData.itemid}
            on:input={(e) => console.log('Item ID input:', e.target.value)}
            on:focus={() => console.log('Item ID focused')}
            autocomplete="off"
            required
            placeholder="e.g., BK-FRK-01"
          />
          <label for="itemname">Item/Part Name</label>
          <input
            id="itemname"
            type="text"
            bind:value={formData.itemname}
            on:input={(e) => console.log('Item Name input:', e.target.value)}
            autocomplete="off"
            required
            placeholder="e.g., Bicycle Fork"
          />
          <!-- Keep other inputs as-is for now to focus on these two -->
          <label for="description">Description</label>
          <input id="description" type="text" bind:value={formData.description} autocomplete="off" placeholder="e.g., Carbon fiber, 700c"/>
          <label for="quantity">Quantity</label>
          <input id="quantity" type="number" bind:value={formData.quantity} min="0" required />
          <label for="price">Price</label>
          <input id="price" type="number" step="0.01" bind:value={formData.price} min="0" required />
          <label for="supplierid">Supplier ID</label>
          <input id="supplierid" type="text" bind:value={formData.supplierid} autocomplete="off" placeholder="e.g., SUP-001"/>
          <button type="submit">{editingItem ? 'Update Item' : 'Add Item'}</button>
          {#if editingItem}
            <button type="button" on:click={cancelEdit}>Cancel Edit</button>
          {/if}
        </form>
      </section>

      <section>
      {#if partColumns.length > 0}
         <h2>Inventory Items ({partTableName})</h2>
         {#if parts.length > 0}
           <table>
             <thead>
               <tr>
                 {#each partColumns as column}
                   <th on:click={() => sortParts(column.name)} title="Sort by {column.display}">
                     {column.display}
                     {#if sortColumn === column.name}
                       {sortDirection === 'asc' ? ' ▲' : ' ▼'}
                     {/if}
                   </th>
                 {/each}
                 <th>Actions</th>
               </tr>
             </thead>
             <tbody>
               {#each parts as part}
                 <tr>
                   {#each partColumns as column}
                     <td>{part[column.name] ?? 'N/A'}</td>
                   {/each}
                   <td>
                     <button on:click={() => editInventoryItem(part)}>Edit</button>
                     <button on:click={() => deleteInventoryItem(part.id)} style="color: red;">Delete</button>
                   </td>
                 </tr>
               {:else}
                 <tr>
                    <td colspan={partColumns.length + 1}>No inventory items found in '{partTableName}'. Add one above.</td>
                 </tr>
               {/each}
             </tbody>
           </table>
         {:else}
            <p>No inventory items found in '{partTableName}'. Add one using the form above.</p>
            <button on:click={fetchParts} disabled={loading}>Refresh Items</button>
         {/if}
       {:else}
         <p>Inventory table structure not determined. Generate the service spec first.</p>
       {/if}
      </section>

      <section>
       {#if suppliers.length > 0}
         <h2>Suppliers</h2>
         <table>
           <thead>
             <tr>
               <th>Supplier ID</th>
               <th>Name</th>
               <th>Contact</th>
               <th>Address</th>
             </tr>
           </thead>
           <tbody>
             {#each suppliers as supplier}
               <tr>
                 <td>{supplier.supplierid ?? 'N/A'}</td>
                 <td>{supplier.suppliername ?? 'N/A'}</td>
                 <td>{supplier.contactinfo ?? 'N/A'}</td>
                 <td>{supplier.address ?? 'N/A'}</td>
               </tr>
             {/each}
           </tbody>
         </table>
        {:else if serviceGenerated}
            <p>No suppliers found.</p>
             <button on:click={fetchSuppliers} disabled={loading}>Refresh Suppliers</button>
       {/if}
      </section>

      <section>
       {#if stores.length > 0}
         <h2>Stores</h2>
         <table>
           <thead>
             <tr>
               <th>Store ID</th>
               <th>Name</th>
               <th>Location</th>
               <th>Manager</th>
             </tr>
           </thead>
           <tbody>
             {#each stores as store}
               <tr>
                 <td>{store.storeid ?? 'N/A'}</td>
                 <td>{store.storename ?? 'N/A'}</td>
                 <td>{store.location ?? 'N/A'}</td>
                 <td>{store.manager ?? 'N/A'}</td>
               </tr>
             {/each}
           </tbody>
         </table>
        {:else if serviceGenerated}
            <p>No stores found.</p>
            <button on:click={fetchStores} disabled={loading}>Refresh Stores</button>
       {/if}
      </section>

    {/if}
  {/if}
</main>

<style>
  main {
    max-width: 900px;
    margin: 20px auto;
    padding: 20px;
    font-family: sans-serif;
  }
  section {
      margin-bottom: 30px;
      padding: 15px;
      border: 1px solid #eee;
      border-radius: 5px;
  }
  h1, h2, h3 {
      color: #333;
  }
  form {
    display: grid; /* Use grid for better alignment */
    grid-template-columns: auto 1fr; /* Label, Input */
    gap: 10px 15px;
    margin-bottom: 20px;
    align-items: center; /* Vertically align items in grid */
  }
  label {
      text-align: right; /* Align labels to the right */
      font-weight: bold;
  }
  input, button, select { /* Added select */
    padding: 8px 12px;
    font-size: 16px;
    border: 1px solid #ccc;
    border-radius: 4px;
  }
   /* Span button across both columns */
  form button[type="submit"], form button[type="button"] {
      grid-column: 1 / -1; /* Span across all columns */
      margin-top: 10px;
      justify-self: start; /* Align button to the left */
      width: auto;
      cursor: pointer;
  }
   form button[type="button"] {
       background-color: #eee;
   }
   form button:disabled {
       opacity: 0.6;
       cursor: not-allowed;
   }

  table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 20px;
    font-size: 14px; /* Slightly smaller table font */
  }
  th, td {
    border: 1px solid #ddd;
    padding: 10px 12px; /* More padding */
    text-align: left;
    vertical-align: top; /* Align content top */
  }
  th {
    background-color: #f2f2f2;
    cursor: pointer;
    white-space: nowrap; /* Prevent header wrapping */
  }
   tbody tr:nth-child(odd) {
       background-color: #f9f9f9; /* Zebra striping */
   }
   tbody tr:hover {
       background-color: #f1f1f1; /* Hover effect */
   }
   td button {
       padding: 4px 8px;
       font-size: 12px;
       margin-right: 5px;
       cursor: pointer;
   }
  pre {
    background-color: #f4f4f4;
    padding: 15px;
    border: 1px solid #ddd;
    border-radius: 5px;
    overflow-x: auto;
    white-space: pre-wrap; /* Allow wrapping */
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