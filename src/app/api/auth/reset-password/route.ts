import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { auditLog } from "@/lib/server/auditLog";

/**
 * POST /api/auth/reset-password
 * Runs inside the recovery session created by the Supabase reset link.
 * Supabase Auth stores the new password; nothing is written to public tables.
 */
export async function POST(request: NextRequest) {
  let body: { password?: string; confirmPassword?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const password = body.password || "";
  const confirmPassword = body.confirmPassword || "";

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 }
    );
  }
  if (password !== confirmPassword) {
    return NextResponse.json({ error: "Passwords do not match." }, { status: 400 });
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

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      { error: "Your reset link has expired. Please request a new one." },
      { status: 401 }
    );
  }

  const { error: updateError } = await supabase.auth.updateUser({ password });
  if (updateError) {
    return NextResponse.json(
      { error: updateError.message || "Unable to update the password." },
      { status: 400 }
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, institute_id, username")
    .eq("id", user.id)
    .maybeSingle();

  if (profile) {
    await auditLog({
      supabase,
      instituteId: profile.institute_id,
      actorUserId: user.id,
      actorUsername: profile.username || user.email || "",
      action: "PASSWORD_RESET",
      resourceType: "Auth",
      resourceId: user.id,
      description: "Password updated",
    });
  }

  const response = NextResponse.json({ success: true }, { status: 200 });
  cookiesToReturn.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options as never);
  });

  return response;
}
