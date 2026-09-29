import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let publicClient: SupabaseClient | null = null;

/**
 * Cookie-less anon Supabase client used for PUBLIC website reads.
 * Keeps public pages free of request-bound auth state.
 * Returns null when env vars are not configured yet.
 */
export function createPublicSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) return null;
  if (url.includes("your-project-ref")) return null;

  if (!publicClient) {
    publicClient = createClient(url, anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return publicClient;
}
