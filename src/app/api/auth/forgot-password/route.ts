import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * POST /api/auth/forgot-password
 * Accepts an email address OR an admin username and sends the Supabase
 * password-reset email. Response is intentionally generic.
 */
export async function POST(request: NextRequest) {
  let body: { identifier?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const identifier = (body.identifier || "").trim();
  if (!identifier) {
    return NextResponse.json({ error: "Enter your username or email." }, { status: 400 });
  }

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

  let email = identifier;

  if (!identifier.includes("@")) {
    const { data: resolved } = await supabase.rpc("lookup_auth_email_by_username", {
      p_username: identifier.toLowerCase(),
    });
    if (!resolved) {
      // Generic response: never reveals whether an account exists.
      return NextResponse.json(
        { success: true, message: "If that account exists, a reset link has been sent." },
        { status: 200 }
      );
    }
    email = resolved as string;
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;

  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/admin/reset-password`,
  });

  const response = NextResponse.json(
    { success: true, message: "If that account exists, a reset link has been sent." },
    { status: 200 }
  );
  cookiesToReturn.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options as never);
  });

  return response;
}
