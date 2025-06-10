// src/hooks.server.ts
import { createServerClient } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  try {
    event.locals.supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
      cookies: {
        get: (key) => {
          return event.cookies.get(key);
        },
        set: (key, value, options) => {
          event.cookies.set(key, value, { ...options, path: '/', sameSite: 'lax' });
        },
        remove: (key, options) => {
          event.cookies.set(key, '', { ...options, path: '/', maxAge: 0 });
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

  // Only log significant session events, not every request
  const sessionEmail = event.locals.session?.data?.session?.user?.email;
  if (sessionEmail && event.url.pathname === '/') {
    console.log(`🔐 User session active: ${sessionEmail}`);
  }

  // Filter out Chrome DevTools requests to avoid 404 noise
  if (event.url.pathname.includes('/.well-known/appspecific/com.chrome.devtools')) {
    return new Response('Not found', { status: 404 });
  }

  const response = await resolve(event, {
    filterSerializedResponseHeaders(name) {
      return name === 'content-range' || name === 'x-supabase-api-version';
    },
  });
  return response;
};