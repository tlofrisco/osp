import { json } from '@sveltejs/kit';

export async function GET() {
  return json({
    envAnon: process.env.VITE_SUPABASE_ANON_KEY,
    envUrl: process.env.VITE_SUPABASE_URL
  });
}
