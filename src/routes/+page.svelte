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
  let gatheringRequirements = false;
  let conversationContext = [];
  let questionCount = 0;
  const MAX_QUESTIONS = 5; // Limit to avoid endless questioning

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

  // Generate next clarifying question dynamically based on context
  async function generateNextQuestion() {
    loading = true;
    try {
      const response = await fetch('/api/osp/generate-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          problem: serviceDraft.problem,
          requirements: serviceDraft.requirements,
          conversationHistory: conversationContext,
          questionNumber: questionCount + 1,
          maxQuestions: MAX_QUESTIONS
        })
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to generate question');
      
      return data;
    } catch (err) {
      console.error('Failed to generate question:', err);
      // Fallback to finishing if question generation fails
      return null;
    } finally {
      loading = false;
    }
  }

  async function handleInitialInput() {
    if (step === 1) {
      serviceDraft.problem = inputValue;
      
      // Add to chat history
      chatHistory = [...chatHistory, { type: 'user', content: inputValue }];
      conversationContext.push({ role: 'user', content: inputValue });
      
      // Move to step 2 - ask for specific requirements
      chatHistory = [...chatHistory, { 
        type: 'ai', 
        content: `I understand you want to build ${inputValue}. Do you have any specific requirements or features in mind? (You can type "no" if you'd like me to help you figure them out)`
      }];
      
      inputValue = '';
      step = 2;
    }
  }

  async function handleRequirementsInput() {
    // Add to chat history
    chatHistory = [...chatHistory, { type: 'user', content: inputValue }];
    conversationContext.push({ role: 'user', content: inputValue });
    
    // Check if user has specific requirements or needs help
    const hasSpecificRequirements = inputValue.toLowerCase() !== 'no' && 
                                   inputValue.toLowerCase() !== 'none' &&
                                   inputValue.length > 10;
    
    if (hasSpecificRequirements) {
      serviceDraft.requirements = inputValue;
      
      // Add AI response
      chatHistory = [...chatHistory, { 
        type: 'ai', 
        content: "Great! Let me ask you a few more questions to ensure I understand your needs completely."
      }];
    } else {
      // User needs help figuring out requirements
      chatHistory = [...chatHistory, { 
        type: 'ai', 
        content: "No problem! I'll help you figure out what you need. Let me ask you some questions."
      }];
    }
    
    inputValue = '';
    gatheringRequirements = true;
    
    // Generate first dynamic question
    const questionData = await generateNextQuestion();
    if (questionData && questionData.question) {
      chatHistory = [...chatHistory, { 
        type: 'ai', 
        content: questionData.question,
        questionType: questionData.type,
        options: questionData.options
      }];
      conversationContext.push({ role: 'assistant', content: questionData.question });
    } else {
      // If no question generated, proceed to service generation
      finishRequirementsGathering();
    }
  }

  async function handleClarifyingAnswer() {
    // Add answer to requirements and context
    if (serviceDraft.requirements) {
      serviceDraft.requirements += `. ${inputValue}`;
    } else {
      serviceDraft.requirements = inputValue;
    }
    
    // Add to chat history
    chatHistory = [...chatHistory, { type: 'user', content: inputValue }];
    conversationContext.push({ role: 'user', content: inputValue });
    inputValue = '';
    
    questionCount++;
    
    // Check if we should ask more questions
    if (questionCount < MAX_QUESTIONS) {
      // Generate next question based on all context so far
      const questionData = await generateNextQuestion();
      
      if (questionData && questionData.question) {
        chatHistory = [...chatHistory, { 
          type: 'ai', 
          content: questionData.question,
          questionType: questionData.type,
          options: questionData.options
        }];
        conversationContext.push({ role: 'assistant', content: questionData.question });
      } else {
        // No more questions needed
        finishRequirementsGathering();
      }
    } else {
      // Reached max questions
      finishRequirementsGathering();
    }
  }

  function finishRequirementsGathering() {
    chatHistory = [...chatHistory, { 
      type: 'ai', 
      content: "Perfect! I have all the information I need. Let me create your service now..."
    }];
    generateSpec();
  }

  async function generateSpec() {
    if (!user) return error = 'Please sign in to generate a service.';
    loading = true;
    try {
      const response = await fetch('/api/osp/service', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...serviceDraft,
          conversationContext // Include full conversation for better service generation
        })
      });
      const data = await response.json();
      console.log('Response:', data);
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

  // Handle option selection for multiple choice questions
  function selectOption(option) {
    inputValue = option;
    handleClarifyingAnswer();
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
      <h2>What service would you like to build?</h2>
      <form on:submit|preventDefault={handleInitialInput}>
        <input 
          type="text" 
          bind:value={inputValue} 
          required 
          placeholder="e.g., A restaurant reservation system" 
        />
        <button type="submit" disabled={loading}>Next</button>
      </form>
    {:else}
      <div class="chat-container">
        <div class="chat-history">
          {#each chatHistory as message}
            <div class="chat-message {message.type}">
              <span class="chat-icon">{message.type === 'ai' ? '🤖' : '👤'}</span>
              <div class="message-content">
                <p>{message.content}</p>
                
                <!-- Show options for multiple choice questions -->
                {#if message.type === 'ai' && message.options && message.options.length > 0}
                  <div class="options-grid">
                    {#each message.options as option}
                      <button 
                        class="option-button"
                        on:click={() => selectOption(option)}
                        disabled={loading}
                      >
                        {option}
                      </button>
                    {/each}
                  </div>
                {/if}
              </div>
            </div>
          {/each}
          
          {#if loading}
            <div class="chat-message ai">
              <span class="chat-icon">🤖</span>
              <div class="message-content">
                <p class="thinking">Thinking...</p>
              </div>
            </div>
          {/if}
        </div>
        
        <form on:submit|preventDefault={step === 2 && !gatheringRequirements ? handleRequirementsInput : handleClarifyingAnswer} class="chat-input">
          <input 
            type="text" 
            bind:value={inputValue} 
            required 
            placeholder={step === 2 && !gatheringRequirements ? "Describe any specific requirements..." : "Type your answer..."} 
            disabled={loading}
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Processing...' : 'Send'}
          </button>
        </form>
      </div>
    {/if}
    
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
    height: 600px;
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
  
  .message-content {
    max-width: 70%;
  }
  
  .chat-message p {
    margin: 0;
    padding: 0.75rem 1rem;
    border-radius: 8px;
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
  
  .thinking {
    color: #6b7280;
    font-style: italic;
  }
  
  .options-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 0.5rem;
    margin-top: 0.5rem;
  }
  
  .option-button {
    padding: 0.5rem 1rem;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    cursor: pointer;
    text-align: left;
    transition: all 0.2s;
    font-size: 0.875rem;
  }
  
  .option-button:hover:not(:disabled) {
    background: #f3f4f6;
    border-color: #3b82f6;
  }
  
  .option-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
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
