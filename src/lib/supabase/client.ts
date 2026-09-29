import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client for browser (client component) usage.
 * Uses cookie-based auth state managed by @supabase/ssr.
 * Only exposes NEXT_PUBLIC_* variables, never the service role key.
 */
export function createSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables."
    );
  }

  return createBrowserClient(url, anonKey);
}
