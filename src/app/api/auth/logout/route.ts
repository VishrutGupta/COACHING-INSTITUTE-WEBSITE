import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/** POST /api/auth/logout — clears the Supabase auth session cookies. */
export async function POST(request: NextRequest) {
  let supabaseResponse: NextResponse = NextResponse.next({ request });
  const cookiesToReturn: { name: string; value: string; options?: Record<string, unknown> }[] =
    [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
          cookiesToSet.forEach(({ name, value, options }) =>
            cookiesToReturn.push({ name, value, options })
          );
        },
      },
    }
  );

  await supabase.auth.signOut();

  const response = NextResponse.json({ success: true }, { status: 200 });
  cookiesToReturn.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options as never);
  });

  return response;
}
