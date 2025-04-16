<script lang="ts">
    import { onMount } from 'svelte'; // onMount isn't used here, can be removed if not needed elsewhere

    let message = '';
    let runId = '';
    let isLoading = false; // To disable button during processing

    async function startAgentLoop() {
        isLoading = true;
        message = '⏳ Starting agent run...';
        runId = '';

        try {
            // Step 1: Call the start endpoint
            const startRes = await fetch('/api/agent/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
                // No body needed for start endpoint as defined
            });

            // Always try to parse JSON, even for errors, as our API returns JSON errors
            const startData = await startRes.json();

            // Check if the HTTP request itself was successful (status 2xx)
            // and if the application-level response indicates success
            if (startRes.ok && startData.success && startData.run_id) {
                runId = startData.run_id;
                // Display success and provide feedback on the loop trigger status
                message = `✅ Agent run initiated successfully.\nRun ID: ${runId}\nLoop Trigger Status: ${startData.loop_status || 'unknown'}\nDetails: ${startData.loop_details || 'N/A'}`;

                // Log the full result for debugging if needed
                console.log('Agent Start Response:', startData);

                // NOTE: The call to /api/agent/loop is now handled internally
                // by /api/agent/start. No need to call it again from here.

            } else {
                // Handle failed HTTP request or application-level error
                console.error('Failed API Response:', { status: startRes.status, body: startData });
                message = `❌ Failed to start agent run.\nError: ${startData?.error || `Server responded with status ${startRes.status}`}\nDetails: ${startData?.details || 'No additional details provided.'}`;
            }

        } catch (error) {
            // Handle network errors or issues with the fetch call itself
            console.error('Network or fetch error:', error);
            message = `❌ Network error or failed to fetch.\nDetails: ${error.message}`;
            isLoading = false; // Ensure loading state is reset on unexpected errors
        } finally {
            // Reset loading state regardless of success or failure
            isLoading = false;
        }
    }
</script>

<h1>🔁 Trigger AI-OSP Agent Loop</h1>

<button on:click={startAgentLoop} disabled={isLoading}>
    {#if isLoading}
        Processing...
    {:else}
        Start Agent Loop
    {/if}
</button>

<pre style="whitespace: pre-wrap; margin-top: 1em; border: 1px solid #ccc; padding: 0.5em;">{message}</pre>

<style>
    button:disabled {
        cursor: not-allowed;
        opacity: 0.6;
    }
</style>