// This is a simplified version of the new `+page.svelte` in `routes/`.
// It focuses purely on service generation (Step 1 and 2) and moves preview to a new route.

<script>
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';
  import { goto } from '$app/navigation';

  let user = null;
  let email = '';
  let password = '';
  let step = 1;
  let inputValue = '';
  let error = '';
  let loading = false;
  let serviceDraft = { problem: '', requirements: '', frameworks: ['TMForumSID', 'ARTS'] };

  onMount(async () => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) return console.error(sessionError);
    user = session?.user ?? null;
  });

  async function signIn() {
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) return error = authError.message;
    user = data.user;
  }

  async function signUp() {
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: 'http://localhost:5173' }
    });
    error = authError ? authError.message : 'Check your email to confirm signup.';
  }

  async function generateSpec() {
    if (!user) return error = 'Please sign in to generate a service.';
    loading = true;
    try {
      const response = await fetch('/api/osp/service', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(serviceDraft)
      });
      const data = await response.json();
      console.log('Response:', data); // ✅ Add this for debug
      if (!response.ok || data.error) throw new Error(data.error || 'Unknown error');
      const schema = data?.service_schema ?? data?.service?.service_schema;

      if (!schema) {
        error = 'Missing service schema in response!';
        return;
      }

      goto(`/service/${schema}`);

    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  }
</script>

<main>
  {#if !user}
    <h1>Sign In / Sign Up</h1>
    <form on:submit|preventDefault={signIn}>
      <label for="email">Email</label>
      <input id="email" type="email" bind:value={email} required />
      <label for="password">Password</label>
      <input id="password" type="password" bind:value={password} required />
      <button type="submit">Sign In</button>
      <button type="button" on:click={signUp}>Sign Up</button>
    </form>
    {#if error}<p style="color: red">{error}</p>{/if}
  {:else}
    <h1>One Service Platform Builder</h1>
    <p>Welcome, {user.email}</p>
    <h2>Step {step}: {step === 1 ? 'What are you looking to build?' : 'Any specific requirements?'}</h2>
    <form on:submit|preventDefault={() => {
      if (step === 1) {
        serviceDraft.problem = inputValue;
        inputValue = '';
        step = 2;
      } else {
        serviceDraft.requirements = inputValue;
        generateSpec();
      }
    }}>
      <input type="text" bind:value={inputValue} required placeholder={step === 1 ? 'e.g., An SMB inventory system' : 'e.g., Track parts, suppliers, and stock levels'} />
      <button type="submit" disabled={loading}>{step === 1 ? 'Next' : 'Generate Service'}</button>
    </form>
    {#if loading}<p>Loading...</p>{/if}
    {#if error && !loading}<p style="color: red">{error}</p>{/if}
  {/if}
</main>

<style>
  main {
    max-width: 600px;
    margin: auto;
    padding: 2rem;
  }
  form {
    display: grid;
    gap: 1rem;
  }
  input, button {
    font-size: 1rem;
    padding: 0.5rem;
  }
</style>
