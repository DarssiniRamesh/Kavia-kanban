import { createClient } from '@supabase/supabase-js';

// PUBLIC_INTERFACE
export function getSupabaseClient() {
  // You may want to put these in env vars for production.
  const SUPABASE_URL = 'https://xpnzoplduejzkgaypfwo.supabase.co';
  const SUPABASE_ANON_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwbnpvcGxkdWVqemtnYXlwZndvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNDEzNzMsImV4cCI6MjA2NDYxNzM3M30.Rf6JmMdIQT8Sgk9gqhkAR5JeiOC3zb-TmCaciMKQOqA';
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
