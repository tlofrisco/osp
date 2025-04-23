// 📁 File: src/routes/service/+layout.svelte

<script>
  export let data;
</script>

<main>
  <header>
    <h1>Service Workspace: {data?.serviceName ?? 'Unnamed Service'}</h1>
  </header>
  <slot />
</main>

<style>
  header {
    padding: 1rem 0;
    border-bottom: 2px solid #ccc;
    margin-bottom: 2rem;
  }
</style>
