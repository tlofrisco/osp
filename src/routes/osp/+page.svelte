<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { supabase } from '$lib/supabase';

  let user = null;
  let email = '';
  let password = '';
  let error = '';
  let loading = false;

  let step = 1;
  let inputValue = '';
  let serviceDraft = {
    problem: '',
    requirements: '',
    frameworks: ['TMForumSID', 'ARTS']
  };

  const questions = {
    1: 'What are you looking to build?',
    2: 'Any specific requirements?'
  };

  onMount(async () => {
    const {
      data: { session },
      error: sessionError
    } = await supabase.auth.getSession();
    if (sessionError) {
      console.error('Session fetch error:', sessionError);
      return;
    }
    if (session) {
      user = session.user;
    }
  });

  async function signUp() {
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: 'http://localhost:5173' }
    });
    error = authError ? authError.message : 'Check your email to confirm signup.';
  }

  async function signIn() {
    const {
      data,
      error: authError
    } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) error = authError.message;
    else user = data.user;
  }

  async function signOut() {
    const { error: signOutError } = await supabase.auth.signOut();
    if (!signOutError) user = null;
  }

  async function generateService() {
    if (!user) {
      error = 'Please sign in first.';
      return;
    }
    loading = true;
    error = '';

    try {
      const response = await fetch('/api/osp/service', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(serviceDraft)
      });

      const result = await response.json();
      if (!response.ok || result.error) throw new Error(result.error);

      const newServiceId = result.service_id || result.id;
      await goto(`/service/${result.service_schema}`);
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
      <input type="email" bind:value={email} placeholder="Email" required />
      <input type="password" bind:value={password} placeholder="Password" required />
      <button type="submit">Sign In</button>
      <button type="button" on:click={signUp}>Sign Up</button>
    </form>
    {#if error}<p style="color: red">{error}</p>{/if}
  {:else}
    <h1>OSP Builder</h1>
    <p>Welcome, {user.email} <button on:click={signOut}>Sign Out</button></p>

    <h2>Step {step}: {questions[step]}</h2>
    <form on:submit|preventDefault={() => {
      if (step === 1) {
        serviceDraft.problem = inputValue;
        step = 2;
        inputValue = '';
      } else {
        serviceDraft.requirements = inputValue;
        generateService();
      }
    }}>
      <input type="text" bind:value={inputValue} placeholder={step === 1 ? 'e.g., A smart tax evaluator' : 'e.g., Should allow upload of W2 and check errors'} required />
      <button type="submit" disabled={loading}>{step === 1 ? 'Next' : 'Generate'}</button>
    </form>

    {#if error}<p style="color: red">{error}</p>{/if}
    {#if loading}<p>Loading...</p>{/if}
  {/if}
</main>

<style>
  main {
    max-width: 600px;
    margin: 2rem auto;
    padding: 2rem;
    font-family: sans-serif;
  }
  input, button {
    display: block;
    width: 100%;
    margin-bottom: 1rem;
    padding: 0.75rem;
    font-size: 1rem;
  }
  button {
    background: #222;
    color: white;
    cursor: pointer;
  }
</style>
