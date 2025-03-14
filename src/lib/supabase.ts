import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gqhrgbhmunksvwndwwzr.supabase.co'; // From Supabase dashboard
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxaHJnYmhtdW5rc3Z3bmR3d3pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDExNDY3NzQsImV4cCI6MjA1NjcyMjc3NH0.jDpEU_oM-CjMtbm-inVmmkScgLu44J9FalmL3D1EN2E'; // From Supabase dashboard

export const supabase = createClient(supabaseUrl, supabaseAnonKey);