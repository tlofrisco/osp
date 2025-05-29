import { json } from '@sveltejs/kit';
import { createAgentBranch } from '$lib/github/githubClient';

export async function GET() {
  const branchName = `agent-test-${Date.now()}`;
  try {
    console.log("🔍 Starting GitHub test with branch:", branchName);
    const result = await createAgentBranch(branchName);
    return json({ message: `✅ Branch created: ${result}` });
  } catch (err: any) {
    console.error("❌ GitHub Error:", err);
    console.error("❌ Error details:", {
      status: err?.status,
      message: err?.message,
      documentation_url: err?.documentation_url
    });
    return json({ 
      error: err?.message || err?.toString(),
      details: {
        status: err?.status,
        documentation_url: err?.documentation_url
      }
    }, { status: 500 });
  }
}
