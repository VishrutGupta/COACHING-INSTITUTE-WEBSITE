import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { auditLog } from "@/lib/server/auditLog";

interface CookiePair {
  name: string;
  value: string;
  options?: Record<string, unknown>;
}

/**
 * POST /api/auth/login
 * Username + password sign-in.
 * 1) resolve username -> auth email (SECURITY DEFINER RPC)
 * 2) Supabase Auth signInWithPassword (Supabase Auth owns the password)
 * 3) profile + disabled check
 * 4) one LOGIN audit record
 */
export async function POST(request: NextRequest) {
  let body: { username?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const username = (body.username || "").trim().toLowerCase();
  const password = body.password || "";

  if (!username || !password) {
    return NextResponse.json(
      { error: "Username and password are required." },
      { status: 400 }
    );
  }

  let supabaseResponse: NextResponse = NextResponse.next({ request });
  const cookiesToReturn: CookiePair[] = [];

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

  // Step 1: username -> email
  const { data: authEmail, error: lookupError } = await supabase.rpc(
    "lookup_auth_email_by_username",
    { p_username: username }
  );

  if (lookupError) {
    console.error("[login] username lookup failed:", lookupError.code, lookupError.message);
    return NextResponse.json(
      { error: "Unable to sign in right now. Please try again later." },
      { status: 500 }
    );
  }

  if (!authEmail) {
    return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
  }

  // Step 2: Supabase Auth
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: authEmail,
    password,
  });

  if (signInError || !signInData.user) {
    if (signInError?.code === "email_not_confirmed") {
      return NextResponse.json(
        { error: "Please verify your email before signing in." },
        { status: 401 }
      );
    }
    return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
  }

  // Step 3: profile check
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, institute_id, full_name, role, username, is_disabled")
    .eq("id", signInData.user.id)
    .single();

  if (profileError || !profile) {
    console.error("[login] profile lookup failed:", profileError?.message);
    await supabase.auth.signOut();
    return NextResponse.json(
      { error: "Your admin profile is not configured yet. Please contact support." },
      { status: 500 }
    );
  }

  if (profile.is_disabled) {
    await supabase.auth.signOut();
    return NextResponse.json(
      { error: "Your account has been disabled. Please contact the administrator." },
      { status: 403 }
    );
  }

  // Step 4: exactly one LOGIN audit record
  await auditLog({
    supabase,
    instituteId: profile.institute_id,
    actorUserId: signInData.user.id,
    actorUsername: profile.username || username,
    action: "LOGIN",
    resourceType: "Auth",
    resourceId: null,
    description: `User "${profile.username || username}" logged in`,
  });

  const response = NextResponse.json(
    {
      success: true,
      user: {
        id: profile.id,
        instituteId: profile.institute_id,
        email: signInData.user.email,
        fullName: profile.full_name || "",
        username: profile.username || username,
        role: profile.role,
      },
    },
    { status: 200 }
  );

  cookiesToReturn.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options as never);
  });

  return response;
}
