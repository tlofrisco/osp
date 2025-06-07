import { json, error } from '@sveltejs/kit';
import OpenAI from 'openai';
import { OPENAI_API_KEY } from '$env/static/private';
import type { RequestEvent } from '@sveltejs/kit';

export async function POST({ request, locals }: RequestEvent) {
  const sessionResult = locals.session;
  
  if (!sessionResult) {
    throw error(401, 'Unauthorized - No active session detected.');
  }

  const session = sessionResult.data?.session;
  const user = sessionResult.data?.user || session?.user;

  if (!user?.id) {
    throw error(401, 'Unauthorized - Session missing user information.');
  }

  try {
    const { problem, requirements, conversationHistory, questionNumber, maxQuestions } = await request.json();
    
    const openai = new OpenAI({
      apiKey: OPENAI_API_KEY,
      timeout: 30000,
      maxRetries: 2
    });

    const systemPrompt = `You are an expert business analyst helping to gather requirements for a service platform.
Your job is to ask ONE clarifying question at a time to better understand the user's needs.

RULES:
1. Ask questions that help clarify ambiguous requirements
2. Focus on understanding the business problem, not technical implementation
3. Questions should be specific and actionable
4. Prefer multiple-choice or yes/no questions when possible for easier answering
5. Consider what has already been discussed - don't repeat topics
6. ALWAYS ask at least 2 questions before considering the requirements complete
7. Question ${questionNumber} of maximum ${maxQuestions}

Return your response as JSON in one of these formats:

For multiple choice questions:
{
  "question": "Your question here?",
  "type": "multiple_choice",
  "options": ["Option 1", "Option 2", "Option 3"]
}

For open-ended questions:
{
  "question": "Your question here?",
  "type": "open_ended",
  "options": []
}

If no more questions needed (but only after at least 2 questions):
{
  "question": null,
  "complete": true
}`;

    const userPrompt = `Problem Statement: ${problem}
Current Requirements: ${requirements || 'None specified yet'}

Conversation so far:
${conversationHistory.map((msg: any) => `${msg.role}: ${msg.content}`).join('\n')}

Based on this context, what is the NEXT most important clarifying question to ask? 
Remember, this is question ${questionNumber} of ${maxQuestions} maximum.
${questionNumber < 3 ? 'You MUST ask a question since we need at least 2 questions.' : 'If you have enough information to build a good service, you may return null.'}

Please respond with a valid JSON object.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      response_format: { type: "json_object" },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    // Validate the response
    if (!result.question && !result.complete) {
      // If AI didn't return a proper format, create a fallback
      return json({
        question: null,
        complete: true
      });
    }

    return json(result);

  } catch (err) {
    console.error('Question generation error:', err);
    // Don't fail the whole process if question generation fails
    return json({
      question: null,
      complete: true,
      error: err instanceof Error ? err.message : 'Failed to generate question'
    });
  }
} 