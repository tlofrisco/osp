import OpenAI from 'openai';
import type { DebugInput } from './error_collector';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function debugSuggestionAgent(input: DebugInput): Promise<any> {
  const logs = Object.entries(input.context)
    .map(([key, val]) => `### ${key.toUpperCase()}:\n${(val || []).join('\n')}\n`)
    .join('\n');

  const prompt = `You're a debugging assistant for a web platform. Diagnose and suggest fixes based on the following logs:\n\n${logs}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: 'Respond in JSON with keys: summary, suggestions (array), probable_cause.' },
      { role: 'user', content: prompt }
    ]
  });

  try {
    const parsed = JSON.parse(response.choices[0].message.content || '{}');
    return parsed;
  } catch (err) {
    return {
      summary: 'Failed to parse ChatGPT output.',
      suggestions: [],
      probable_cause: 'ChatGPT returned malformed JSON.'
    };
  }
}
