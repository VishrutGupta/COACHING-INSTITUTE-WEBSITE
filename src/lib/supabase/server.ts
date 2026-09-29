import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Supabase server client for Server Components, Server Actions and
 * Route Handlers. Reads/writes auth cookies via the getAll/setAll API
 * required by @supabase/ssr.
 *
 * Cookie writes are best-effort: in Server Components the cookie store is
 * read-only, which is expected (session refresh happens in route handlers).
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Read-only cookie store in Server Components: ignore.
          }
        },
      },
    }
  );
}
