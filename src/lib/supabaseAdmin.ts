// src/lib/supabaseAdmin.ts
import 'dotenv/config'; // ✅ This should always be first!

import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase'; // Path to your supabase.ts file

// Ensure environment variables are defined
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be defined in the environment');
}

console.log('Initializing supabaseAdmin with key:', process.env.SUPABASE_SERVICE_ROLE_KEY);
export const supabaseAdmin: SupabaseClient<Database> = createClient<Database>(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);
console.log('supabaseAdmin initialized');