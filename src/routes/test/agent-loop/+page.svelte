<script lang="ts">
  import { onMount } from 'svelte';
  import Markdown from 'markdown-it';

  const md = new Markdown();

  // Start loop state
  let message = '';
  let runId = '';
  let isLoading = false;

  // Pending decision state
  let pendingEvent: any = null;
  let parsedDescription: any = null;
  let notes = '';
  let decision = '';
  let hardcoreRule = '';
  let starting = false;

  // Most recent service identifiers
  let latestManifestId: string = '';
  let latestServiceId: number = 0;
  let serviceError: string = '';

  onMount(async () => {
    const res = await fetch('/api/agent-event');
    const data = await res.json();
    console.log('Response:', data); // ✅ Add this for debug
    pendingEvent = data.event;

    // Safe JSON parsing
    try {
      if (pendingEvent?.event_description) {
        parsedDescription = JSON.parse(pendingEvent.event_description);
      }
    } catch (e) {
      console.error('❌ Failed to parse event_description:', e);
      parsedDescription = {
        summary: 'Invalid JSON in event_description.',
        probable_cause: 'Not JSON format.',
        suggestions: []
      };
    }

    if (pendingEvent?.rule_id) {
      const ruleRes = await fetch(`/api/hardcore-rule/${pendingEvent.rule_id}`);
      const ruleData = await ruleRes.json();
      if (ruleData?.content_md) {
        hardcoreRule = ruleData.content_md;
      }
    }

    // Fetch the latest service_id and manifest_id
    try {
      const latestServiceRes = await fetch('/api/osp/service');
      const latestServiceData = await latestServiceRes.json();
      if (latestServiceData?.serviceDraft) {
        latestManifestId = latestServiceData.serviceDraft.manifest_id;
        latestServiceId = latestServiceData.serviceDraft.id;
        serviceError = '';
      } else {
        serviceError = 'No service found. Please create a service first.';
      }
    } catch (err) {
      console.error('❌ Failed to fetch latest service ID', err);
      serviceError = 'Failed to fetch service. Please try again.';
    }
  });

  async function startAgentLoop() {
    if (!latestServiceId) {
      message = `❌ ${serviceError}`;
      return;
    }

    isLoading = true;
    message = '⏳ Starting agent run...';
    runId = '';

    try {
      const startRes = await fetch('/api/agent/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          trigger: 'manual_test_start',
          service_id: latestServiceId
        })
      });

      const startData = await startRes.json();

      if (startRes.ok && startData.success && startData.run_id) {
        runId = startData.run_id;
        message = `✅ Agent run initiated successfully.\nRun ID: ${runId}\nLoop Trigger Status: ${startData.loop_status || 'unknown'}\nDetails: ${startData.loop_details || 'N/A'}`;
        console.log('Agent Start Response:', startData);
      } else {
        console.error('Failed API Response:', { status: startRes.status, body: startData });
        message = `❌ Failed to start agent run.\nError: ${startData?.error || `Server responded with status ${startRes.status}`}\nDetails: ${startData?.details || 'No additional details provided.'}`;
      }
    } catch (error) {
      console.error('Network or fetch error:', error);
      message = `❌ Network error or failed to fetch.\nDetails: ${error.message}`;
    } finally {
      isLoading = false;
    }
  }

  async function submitDecision(d: string) {
    decision = d;

    const res = await fetch('/api/decision', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_id: pendingEvent.event_id,
        decision,
        notes,
        decided_by: 'tlofrisco@gmail.com'
      })
    });

    const result = await res.json();
    if (result.success) {
      alert('✅ Decision submitted.');
      pendingEvent = null;
      location.reload(); // full reload to pick up changes
    } else {
      alert('❌ Error submitting decision.');
    }
  }
</script>

<h1>🔁 Trigger AI-OSP Agent Loop</h1>

<button on:click={startAgentLoop} disabled={isLoading}>
  {#if isLoading}
    ⏳ Processing...
  {:else}
    ▶️ Start Agent Loop
  {/if}
</button>

<pre style="white-space: pre-wrap; margin-top: 1em; border: 1px solid #ccc; padding: 0.5em;">{message}</pre>

{#if pendingEvent}
  <hr />
  <section style="margin-top: 2rem;">
    <h2>🧠 Pending Agent Decision</h2>
    <p><strong>Run ID:</strong> {pendingEvent.run_id}</p>
    <p><strong>Detected At:</strong> {new Date(pendingEvent.detected_at).toLocaleString()}</p>

    {#if parsedDescription}
      <h3>📝 Agent Summary</h3>
      <p><strong>Summary:</strong> {parsedDescription.summary}</p>
      <p><strong>Probable Cause:</strong> {parsedDescription.probable_cause}</p>

      <h4>💡 Suggested Fixes:</h4>
      <ul>
        {#each parsedDescription.suggestions as suggestion}
          <li>{suggestion}</li>
        {/each}
      </ul>
    {/if}

    {#if hardcoreRule}
      <h3>🚨 Hard Core Rule</h3>
      <div class="markdown" innerHTML={md.render(hardcoreRule)}></div>
    {/if}

    <h4>🧾 Reviewer Notes:</h4>
    <textarea bind:value={notes} rows="4" placeholder="Optional notes or reasoning..."></textarea>

    <div style="margin-top: 1rem;">
      <button on:click={() => submitDecision('yes')}>✅ Yes (Update rule manually if needed)</button>
      <button on:click={() => submitDecision('no')}>❌ No</button>
      <button on:click={() => submitDecision('conditional')}>⚠️ Conditional</button>
    </div>
  </section>
{:else}
  <p style="margin-top: 2rem;">🎉 No pending agent events.</p>
{/if}

<style>
  button:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  textarea {
    width: 100%;
    margin-top: 0.5rem;
  }

  .markdown :global(h1),
  .markdown :global(h2),
  .markdown :global(h3) {
    margin-top: 1rem;
    font-weight: bold;
  }

  .markdown :global(p) {
    margin: 0.5rem 0;
  }

  .markdown {
    background: #f5f5f5;
    padding: 1rem;
    border-left: 4px solid #ccc;
    border-radius: 6px;
    font-family: monospace;
    margin-bottom: 1rem;
  }
</style>
