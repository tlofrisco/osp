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
  
  // Enhanced chat state
  let chatHistory = [];
  let clarifyingQuestions = [];
  let currentQuestionIndex = 0;
  let gatheringRequirements = false;

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

  // Generate clarifying questions based on the problem statement
  async function generateClarifyingQuestions(problem) {
    // Add the problem to chat history
    chatHistory = [...chatHistory, { type: 'user', content: problem }];
    
    // Generate context-aware questions based on the problem
    const questions = [];
    
    // Restaurant-specific questions
    if (problem.toLowerCase().includes('restaurant') || problem.toLowerCase().includes('reservation')) {
      questions.push(
        "How many tables does your restaurant have, and do you need to track different seating areas?",
        "What types of reservations do you handle (phone, online, walk-in)?",
        "Do you need to track special requests, dietary restrictions, or VIP customers?",
        "What's your typical reservation time slot duration (e.g., 2 hours)?",
        "Do you need integration with a POS system or kitchen management?"
      );
    }
    // Inventory-specific questions
    else if (problem.toLowerCase().includes('inventory') || problem.toLowerCase().includes('stock')) {
      questions.push(
        "What types of items will you track (raw materials, finished goods, both)?",
        "Do you need multi-location inventory tracking?",
        "How do you handle reordering - automatic alerts, purchase orders, or both?",
        "Do you need to track expiration dates or batch numbers?",
        "Will you need barcode scanning or RFID integration?"
      );
    }
    // Generic business questions
    else {
      questions.push(
        "What are the main entities or objects you need to track?",
        "Who are the primary users of this system (roles)?",
        "What are the most critical workflows or processes?",
        "Do you need reporting or analytics features?",
        "Are there any existing systems this needs to integrate with?"
      );
    }
    
    return questions;
  }

  async function handleInitialInput() {
    if (step === 1) {
      serviceDraft.problem = inputValue;
      
      // Generate clarifying questions
      gatheringRequirements = true;
      clarifyingQuestions = await generateClarifyingQuestions(inputValue);
      
      // Add AI response to chat
      chatHistory = [...chatHistory, { 
        type: 'ai', 
        content: `Great! I'd like to understand your ${inputValue} better. Let me ask you a few questions to ensure we build exactly what you need.`
      }];
      
      // Ask first question
      if (clarifyingQuestions.length > 0) {
        chatHistory = [...chatHistory, { 
          type: 'ai', 
          content: clarifyingQuestions[0]
        }];
      }
      
      inputValue = '';
      step = 2;
    }
  }

  async function handleClarifyingAnswer() {
    // Add answer to requirements
    if (serviceDraft.requirements) {
      serviceDraft.requirements += `. ${inputValue}`;
    } else {
      serviceDraft.requirements = inputValue;
    }
    
    // Add to chat history
    chatHistory = [...chatHistory, { type: 'user', content: inputValue }];
    inputValue = '';
    
    // Move to next question or finish
    currentQuestionIndex++;
    
    if (currentQuestionIndex < clarifyingQuestions.length) {
      // Ask next question
      chatHistory = [...chatHistory, { 
        type: 'ai', 
        content: clarifyingQuestions[currentQuestionIndex]
      }];
    } else {
      // All questions answered, generate service
      chatHistory = [...chatHistory, { 
        type: 'ai', 
        content: "Perfect! I have all the information I need. Let me create your service now..."
      }];
      generateSpec();
    }
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
    
    {#if step === 1}
      <h2>What are you looking to build?</h2>
      <form on:submit|preventDefault={handleInitialInput}>
        <input 
          type="text" 
          bind:value={inputValue} 
          required 
          placeholder="e.g., A restaurant reservation system" 
        />
        <button type="submit" disabled={loading}>Next</button>
      </form>
    {:else if gatheringRequirements}
      <div class="chat-container">
        <div class="chat-history">
          {#each chatHistory as message}
            <div class="chat-message {message.type}">
              <span class="chat-icon">{message.type === 'ai' ? '🤖' : '👤'}</span>
              <p>{message.content}</p>
            </div>
          {/each}
        </div>
        
        <form on:submit|preventDefault={handleClarifyingAnswer} class="chat-input">
          <input 
            type="text" 
            bind:value={inputValue} 
            required 
            placeholder="Type your answer..." 
            disabled={loading}
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Processing...' : 'Send'}
          </button>
        </form>
      </div>
    {/if}
    
    {#if loading && !gatheringRequirements}<p>Loading...</p>{/if}
    {#if error && !loading}<p style="color: red">{error}</p>{/if}
  {/if}
</main>

<style>
  main {
    max-width: 800px;
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
  
  .chat-container {
    display: flex;
    flex-direction: column;
    height: 500px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    overflow: hidden;
    background: #f9fafb;
  }
  
  .chat-history {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .chat-message {
    display: flex;
    gap: 0.75rem;
    align-items: flex-start;
  }
  
  .chat-message.user {
    flex-direction: row-reverse;
  }
  
  .chat-icon {
    font-size: 1.5rem;
    flex-shrink: 0;
  }
  
  .chat-message p {
    margin: 0;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    max-width: 70%;
    line-height: 1.5;
  }
  
  .chat-message.ai p {
    background: white;
    border: 1px solid #e5e7eb;
  }
  
  .chat-message.user p {
    background: #3b82f6;
    color: white;
  }
  
  .chat-input {
    display: flex;
    gap: 0.5rem;
    padding: 1rem;
    background: white;
    border-top: 1px solid #e5e7eb;
  }
  
  .chat-input input {
    flex: 1;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    padding: 0.75rem;
  }
  
  .chat-input button {
    padding: 0.75rem 1.5rem;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
  }
  
  .chat-input button:hover:not(:disabled) {
    background: #2563eb;
  }
  
  .chat-input button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
</style>
