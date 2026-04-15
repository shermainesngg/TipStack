import { createClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client using the service_role key.
 * Used by pipeline functions for full CRUD access.
 * NEVER expose this client or key to the browser.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}
