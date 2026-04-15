import { createClient } from "@supabase/supabase-js";

/**
 * Browser-side Supabase client using the anon key.
 * Only has read access to published content via RLS.
 */
export function createBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createClient(url, key);
}
