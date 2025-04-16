export default async function debugSuggestionAgent({ run_id }: { run_id: string }) {
    console.log(`🧠 Running Debug Suggestion Agent on run_id: ${run_id}`);
    return {
      message: `Debug agent received run_id: ${run_id}`,
      recommendations: ['Check terminal logs', 'Inspect browser console', 'Query Supabase logs']
    };
  }
  