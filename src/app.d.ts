// src/app.d.ts
import type { SupabaseClient, Session } from '@supabase/supabase-js'; // Import Session type

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient;
      // Use the correct Session type from Supabase
      // It will be null if the user is not authenticated
      session: Session | null;
    }
    // You can also define PageData and Error types here if needed
    // interface PageData {}
    // interface Error {}
  }
}

export {}; // Keep this export to make it a module
