// src/lib/agents/debug_suggestion_agent.ts
import OpenAI from 'openai';
import { OPENAI_API_KEY } from '$env/static/private';
import type { DebugInput } from './error_collector';

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

export default async function debugSuggestionAgent({
  run_id,
  branch_name,
  service_id,
  input,
  manifest
}: {
  run_id: string;
  branch_name: string;
  service_id: string;
  input: DebugInput;
  manifest: any;
}): Promise<any> {
  console.log('🤖 Debug Agent Called:');
  console.log('🔢 run_id:', run_id);
  console.log('🌿 branch_name:', branch_name);
  console.log('🧩 service_id:', service_id);

  const logs = Object.entries(input.context)
    .map(([key, val]) => `### ${key.toUpperCase()}:\n${(val || []).join('\n')}\n`)
    .join('\n');

  const violations: string[] = [];
  const policies: string[] = manifest?.rules?.global_policies || [];

  const logContains = (keyword: string): boolean => {
    return Object.values(input.context).some((lines) =>
      lines.some((line) => line.includes(keyword))
    );
  };

  if (policies.includes('no_edit_core_files') && logContains('lib/supabase.ts')) {
    violations.push('no_edit_core_files');
  }

  const manifestSummary = `
### MANIFEST CONTEXT:
- Service ID: ${service_id}
- Service Name: ${manifest?.name || '[unknown]'}
- Version: ${manifest?.version}
- Type: ${manifest?.type}
- Branch: ${branch_name}
- API Endpoints: ${manifest?.api?.endpoints?.length || 0}
- Global Policies: ${(policies || []).join(', ') || 'None'}
- Detected Policy Violations: ${violations.join(', ') || 'None'}
`;

  const prompt = `
You're an AI debugging agent for a service-based platform.
Below are logs and a manifest. Identify problems and suggest fixes.

${manifestSummary}

${logs}

Respond in JSON with:
- summary: string
- suggestions: array of strings
- probable_cause: string
- manifest_violations: array of strings (beyond those detected, if any)
`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content:
          'Respond strictly in valid JSON with keys: summary, suggestions, probable_cause, manifest_violations.'
      },
      { role: 'user', content: prompt }
    ]
  });

  try {
    const parsed = JSON.parse(response.choices[0].message.content || '{}');

    return {
      ...parsed,
      run_id,
      branch_name,
      service_id,
      violated_policies: violations
    };
  } catch (err) {
    return {
      run_id,
      branch_name,
      service_id,
      summary: 'Failed to parse ChatGPT output.',
      suggestions: [],
      probable_cause: 'ChatGPT returned malformed JSON.',
      manifest_violations: ['Parse failure'],
      violated_policies: violations
    };
  }
}

