<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { invalidate } from '$app/navigation';
  import Markdown from 'markdown-it';

  const md = new Markdown();

  let pendingEvent: any = null;
  let parsedDescription: any = null;
  let notes = '';
  let decision = '';
  let hardcoreRule = '';

  onMount(async () => {
    const res = await fetch('/api/agent-event');
    const data = await res.json();
    console.log('Response:', data); // ✅ Add this for debug
    pendingEvent = data.event;

    // Safe JSON parsing for event_description
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
  });

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
      invalidate('/test/agent-loop');
    } else {
      alert('❌ Error submitting decision.');
    }
  }
</script>

{#if pendingEvent}
  <section>
    <h2>🧠 Pending Agent Decision</h2>

    <p><strong>Run ID:</strong> {pendingEvent.run_id}</p>
    <p><strong>Detected At:</strong> {new Date(pendingEvent.detected_at).toLocaleString()}</p>

    <hr />

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
      <hr />
      <h3>🚨 Hard Core Rule Triggered</h3>
      <div class="markdown" innerHTML={md.render(hardcoreRule)}></div>
    {/if}

    <hr />
    <h4>🧾 Reviewer Notes:</h4>
    <textarea bind:value={notes} rows="4" placeholder="Optional notes or reasoning..."></textarea>

    <div style="margin-top: 1rem;">
      <button on:click={() => submitDecision('yes')}>✅ Yes (Update rule manually if needed)</button>
      <button on:click={() => submitDecision('no')}>❌ No</button>
      <button on:click={() => submitDecision('conditional')}>⚠️ Conditional</button>
    </div>
  </section>
{:else}
  <p>🎉 No pending agent events.</p>
{/if}

<style>
  .markdown :global(h1), .markdown :global(h2), .markdown :global(h3) {
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
  }
</style>
