// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

// Detect if we're in the browser
const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

console.log('Initializing Supabase client with URL:', PUBLIC_SUPABASE_URL);
export const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    storage: isBrowser ? {
      getItem: (key) => {
        const value = document.cookie.match(new RegExp(`(^| )${key}=([^;]+)`))?.[2] || null;
        console.log('Supabase storage getItem (browser):', key, value);
        return value;
      },
      setItem: (key, value) => {
        console.log('Supabase storage setItem (browser):', key, value);
        document.cookie = `${key}=${value};path=/;max-age=31536000;sameSite=lax`;
      },
      removeItem: (key) => {
        console.log('Supabase storage removeItem (browser):', key);
        document.cookie = `${key}=;path=/;max-age=0;sameSite=lax`;
      }
    } : undefined // Use default (localStorage) server-side for now
  }
});
console.log('Supabase client initialized');