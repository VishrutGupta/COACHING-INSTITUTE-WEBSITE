import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { auditLog } from "@/lib/server/auditLog";
import { defaultInstituteSlug } from "@/lib/data/settings";

/**
 * POST /api/auth/bootstrap — ONE-TIME owner account creation.
 *
 * Refuses to run when an owner profile already exists, so this endpoint
 * cannot be used to mint a second owner. Password goes straight to
 * Supabase Auth and is never stored in a public table.
 *
 * Body: { username, password, fullName?, email? }
 */
export async function POST(request: NextRequest) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      { error: "Server is missing SUPABASE_SERVICE_ROLE_KEY configuration." },
      { status: 500 }
    );
  }

  let body: {
    username?: string;
    password?: string;
    fullName?: string;
    email?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const username = (body.username || "").trim().toLowerCase();
  const password = body.password || "";
  const fullName = (body.fullName || "Institute Owner").trim();
  const email = (body.email || `${username}@coaching-institute.local`).trim();

  if (!username || !/^[a-z0-9._-]{3,40}$/.test(username)) {
    return NextResponse.json(
      { error: "Username must be 3-40 characters: letters, numbers, dot, dash or underscore." },
      { status: 400 }
    );
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 }
    );
  }

  const admin = getSupabaseAdmin();

  // Guard 1: never allow a second owner.
  const { count: ownerCount, error: ownerCountError } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "owner");

  if (ownerCountError) {
    return NextResponse.json(
      { error: "Unable to verify existing owner: " + ownerCountError.message },
      { status: 500 }
    );
  }
  if ((ownerCount || 0) > 0) {
    return NextResponse.json(
      { error: "An owner account already exists. Bootstrapping is disabled." },
      { status: 403 }
    );
  }

  // Guard 2: username must be free.
  const { data: existingUsername } = await admin
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (existingUsername) {
    return NextResponse.json({ error: "Username already taken." }, { status: 409 });
  }

  // Resolve target institute.
  const { data: institute, error: instituteError } = await admin
    .from("institutes")
    .select("id, name")
    .eq("slug", defaultInstituteSlug())
    .maybeSingle();

  if (instituteError || !institute) {
    return NextResponse.json(
      { error: "No institute found. Run supabase/SEED_DATABASE.sql first." },
      { status: 500 }
    );
  }

  // Create the auth user (Supabase Auth owns credentials).
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, username },
  });

  if (createError || !created.user) {
    return NextResponse.json(
      { error: createError?.message || "Unable to create the owner account." },
      { status: 400 }
    );
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: created.user.id,
    institute_id: institute.id,
    full_name: fullName,
    username,
    role: "owner",
    is_disabled: false,
  });

  if (profileError) {
    // Roll back the orphaned auth user so a retry stays clean.
    await admin.auth.admin.deleteUser(created.user.id);
    return NextResponse.json(
      { error: "Unable to create the owner profile: " + profileError.message },
      { status: 500 }
    );
  }

  await auditLog({
    supabase: admin,
    instituteId: institute.id,
    actorUserId: created.user.id,
    actorUsername: username,
    action: "OWNER_BOOTSTRAP",
    resourceType: "User",
    resourceId: created.user.id,
    description: `Owner account "${username}" created for ${institute.name}`,
  });

  return NextResponse.json(
    {
      success: true,
      message: "Owner account created. You can now sign in.",
      user: { id: created.user.id, username, role: "owner" },
    },
    { status: 201 }
  );
}
