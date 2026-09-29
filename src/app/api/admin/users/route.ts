import { NextRequest, NextResponse } from "next/server";
import { requireUser, handleApiError, jsonError } from "@/lib/server/api";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { PERMISSIONS, ALL_PERMISSIONS, defaultPermissionsForRole } from "@/lib/constants/permissions";
import { auditLog } from "@/lib/server/auditLog";
import type { Role } from "@/lib/types";

/** GET /api/admin/users — profiles of the caller's institute + their permissions. */
export async function GET() {
  try {
    const user = await requireUser(PERMISSIONS.USERS_VIEW);
    const admin = getSupabaseAdmin();

    const { data: profiles, error } = await admin
      .from("profiles")
      .select("id, institute_id, full_name, username, role, is_disabled, created_at")
      .eq("institute_id", user.instituteId)
      .order("created_at", { ascending: false });

    if (error) return jsonError(error.message, 500);

    const { data: permissions } = await admin
      .from("user_permissions")
      .select("user_id, permission")
      .eq("institute_id", user.instituteId);

    const permissionMap = new Map<string, string[]>();
    for (const row of permissions || []) {
      const list = permissionMap.get(row.user_id) || [];
      list.push(row.permission);
      permissionMap.set(row.user_id, list);
    }

    const users = (profiles || []).map((profile) => ({
      id: profile.id,
      instituteId: profile.institute_id,
      fullName: profile.full_name || "",
      username: profile.username || "",
      role: profile.role as Role,
      isDisabled: profile.is_disabled,
      createdAt: profile.created_at,
      permissions: profile.role === "owner" ? [...ALL_PERMISSIONS] : permissionMap.get(profile.id) || [],
    }));

    return NextResponse.json({ users });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/admin/users — creates an ADMIN or STAFF account.
 * Owner accounts can never be created here.
 * Uses SUPABASE_SERVICE_ROLE_KEY on the server only.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(PERMISSIONS.USERS_CREATE);

    if (user.role !== "owner") {
      return jsonError("Only the owner can create accounts.", 403);
    }

    const body = await request.json();
    const fullName = (body.fullName || "").trim();
    const username = (body.username || "").trim().toLowerCase();
    const email = (body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const role = String(body.role || "");
    const requestedPermissions: string[] | null = Array.isArray(body.permissions)
      ? body.permissions.map(String)
      : null;

    if (!fullName || !username || !email || !password) {
      return jsonError("Full name, username, email and password are required.", 400);
    }
    if (!/^[a-z0-9._-]{3,40}$/.test(username)) {
      return jsonError(
        "Username must be 3-40 characters: letters, numbers, dot, dash or underscore.",
        400
      );
    }
    if (password.length < 8) {
      return jsonError("Password must be at least 8 characters.", 400);
    }
    if (role === "owner") {
      return jsonError("Additional owner accounts cannot be created.", 403);
    }
    if (role !== "admin" && role !== "staff") {
      return jsonError("Role must be admin or staff.", 400);
    }

    const invalidPermission = requestedPermissions?.find(
      (permission) => !(ALL_PERMISSIONS as string[]).includes(permission)
    );
    if (invalidPermission) {
      return jsonError(`Unknown permission: ${invalidPermission}`, 400);
    }

    // Explicit grants win; otherwise seed the account with its role defaults.
    const permissions = requestedPermissions ?? defaultPermissionsForRole(role);

    const admin = getSupabaseAdmin();

    const { data: existingUsername } = await admin
      .from("profiles")
      .select("id")
      .eq("username", username)
      .maybeSingle();
    if (existingUsername) return jsonError("Username already taken.", 409);

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, username },
    });

    if (createError || !created.user) {
      const message = createError?.message || "Unable to create the user.";
      return jsonError(
        message.toLowerCase().includes("already") ? "Email already registered." : message,
        400
      );
    }

    const { error: profileError } = await admin.from("profiles").insert({
      id: created.user.id,
      institute_id: user.instituteId,
      full_name: fullName,
      username,
      role,
      is_disabled: false,
    });

    if (profileError) {
      await admin.auth.admin.deleteUser(created.user.id);
      return jsonError(profileError.message, 500);
    }

    if (permissions.length > 0) {
      const rows = permissions.map((permission) => ({
        user_id: created.user.id,
        institute_id: user.instituteId,
        permission,
      }));
      const { error: permissionError } = await admin.from("user_permissions").insert(rows);
      if (permissionError) {
        console.error("[users] permission insert failed:", permissionError.message);
      }
    }

    await auditLog({
      supabase: admin,
      instituteId: user.instituteId,
      actorUserId: user.id,
      actorUsername: user.username,
      action: "user.create",
      resourceType: "User",
      resourceId: created.user.id,
      description: `Created ${role} account "${username}"`,
      afterData: {
        username,
        full_name: fullName,
        email,
        role,
        permissions: [...permissions].sort(),
      },
    });

    return NextResponse.json(
      {
        user: {
          id: created.user.id,
          fullName,
          username,
          role,
          isDisabled: false,
          permissions,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
