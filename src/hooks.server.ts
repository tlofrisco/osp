// src/hooks.server.ts
import { createServerClient } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  try {
    event.locals.supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
      cookies: {
        get: (key) => {
          const value = event.cookies.get(key);
          console.log(`hooks.server.ts: Cookie Read - ${key}: ${value || 'none'}`);
          return value;
        },
        set: (key, value, options) => {
          console.log(`hooks.server.ts: Cookie Set - ${key}: ${value}`);
          event.cookies.set(key, value, { ...options, path: '/', sameSite: 'lax' });
        },
        remove: (key, options) => {
          console.log(`hooks.server.ts: Cookie Remove - ${key}`);
          event.cookies.set(key, '', { ...options, path: '/', maxAge: 0 }); // Proper removal
        },
      },
    });
  } catch (err) {
    console.error('hooks.server.ts: Error initializing Supabase client:', err);
    return new Response('Internal Server Error: Failed to initialize authentication.', { status: 500 });
  }

  try {
    event.locals.session = await event.locals.supabase.auth.getSession();
  } catch (err) {
    console.error('hooks.server.ts: Error getting session:', err);
    return new Response('Internal Server Error: Failed to retrieve session.', { status: 500 });
  }

  const sessionEmail = event.locals.session?.data?.session?.user?.email ?? 'None';
  console.log(`hooks.server.ts: Session Check - User: ${sessionEmail}`);

  const response = await resolve(event, {
    filterSerializedResponseHeaders(name) {
      return name === 'content-range' || name === 'x-supabase-api-version';
    },
  });
  return response;
};