import { json } from '@sveltejs/kit';
import { GITHUB_TOKEN } from '$env/static/private';

export async function GET() {
  return json({
    hasToken: !!GITHUB_TOKEN,
    tokenLength: GITHUB_TOKEN?.length,
    nodeEnv: process.env.NODE_ENV,
    // Don't log the actual token for security
  });
} 