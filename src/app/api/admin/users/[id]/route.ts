import { NextRequest, NextResponse } from "next/server";
import { requireUser, handleApiError, jsonError, ApiError } from "@/lib/server/api";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  PERMISSIONS,
  ALL_PERMISSIONS,
  defaultPermissionsForRole,
} from "@/lib/constants/permissions";
import { auditLog } from "@/lib/server/auditLog";
import type { Role } from "@/lib/types";
import type { SupabaseClient } from "@supabase/supabase-js";

type Params = { params: Promise<{ id: string }> };

async function loadProfile(instituteId: string, targetId: string) {
  const admin = getSupabaseAdmin();
  const { data } = await admin
    .from("profiles")
    .select("id, institute_id, full_name, username, role, is_disabled")
    .eq("institute_id", instituteId)
    .eq("id", targetId)
    .maybeSingle();
  return (data as Record<string, unknown> | null) || null;
}

async function loadPermissions(admin: SupabaseClient, instituteId: string, userId: string) {
  const { data } = await admin
    .from("user_permissions")
    .select("permission")
    .eq("institute_id", instituteId)
    .eq("user_id", userId);
  return ((data as { permission: string }[] | null) || []).map((row) => row.permission);
}

/** Replaces the stored grant set. Owner always resolves to ALL_PERMISSIONS at read time. */
async function replacePermissions(
  admin: SupabaseClient,
  instituteId: string,
  userId: string,
  permissions: string[]
) {
  const { error: deleteError } = await admin
    .from("user_permissions")
    .delete()
    .eq("institute_id", instituteId)
    .eq("user_id", userId);
  if (deleteError) return deleteError;

  if (permissions.length === 0) return null;

  const { error } = await admin
    .from("user_permissions")
    .insert(
      permissions.map((permission) => ({
        user_id: userId,
        institute_id: instituteId,
        permission,
      }))
    );
  return error;
}

function validatePermissions(raw: unknown): string[] | null {
  if (raw === undefined || raw === null) return null;
  if (!Array.isArray(raw)) throw new ApiError(400, "Permissions must be an array.");
  const invalid = raw.find(
    (permission) => !(ALL_PERMISSIONS as string[]).includes(String(permission))
  );
  if (invalid) throw new ApiError(400, `Unknown permission: ${invalid}`);
  return raw.map(String);
}

/**
 * PATCH /api/admin/users/[id]
 * Updates name, role (admin/staff only), disabled flag and/or permissions.
 * Role changes recompute user_permissions inside the same single audit event.
 * The owner can never be demoted, disabled or deleted.
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const actor = await requireUser(PERMISSIONS.USERS_EDIT);

    if (actor.role !== "owner") {
      return jsonError("Only the owner can change accounts.", 403);
    }

    const { id } = await params;
    const target = await loadProfile(actor.instituteId, id);
    if (!target) return jsonError("User not found.", 404);

    const body = await request.json();
    const admin = getSupabaseAdmin();

    const update: Record<string, unknown> = {};
    const before: Record<string, unknown> = {};
    const after: Record<string, unknown> = {};

    if (body.fullName !== undefined) {
      update.full_name = String(body.fullName).trim();
      before.full_name = target.full_name;
      after.full_name = update.full_name;
    }

    let nextRole: Role | null = null;
    if (body.role !== undefined) {
      const requestedRole = String(body.role) as Role;
      if (target.role === "owner") {
        return jsonError("The owner account cannot be demoted.", 403);
      }
      if (requestedRole === "owner") {
        return jsonError("Accounts cannot be promoted to owner.", 403);
      }
      if (requestedRole !== "admin" && requestedRole !== "staff") {
        return jsonError("Role must be admin or staff.", 400);
      }
      nextRole = requestedRole;
      update.role = requestedRole;
      before.role = target.role;
      after.role = requestedRole;
    }

    if (body.isDisabled !== undefined) {
      if (target.role === "owner" && body.isDisabled) {
        return jsonError("The owner account cannot be disabled.", 403);
      }
      update.is_disabled = Boolean(body.isDisabled);
      before.is_disabled = target.is_disabled;
      after.is_disabled = update.is_disabled;
    }

    const requestedPermissions = validatePermissions(body.permissions);
    if (target.role === "owner" && requestedPermissions !== null) {
      return jsonError("Owner permissions cannot be changed.", 403);
    }

    const roleChanged = Boolean(nextRole) && nextRole !== target.role;
    const permissionsWillChange = roleChanged || requestedPermissions !== null;
    const existingPermissions = permissionsWillChange
      ? await loadPermissions(admin, actor.instituteId, id)
      : [];

    if (permissionsWillChange) {
      before.permissions = existingPermissions.sort();
    }

    let nextPermissions = existingPermissions;
    if (roleChanged && requestedPermissions === null) {
      nextPermissions = defaultPermissionsForRole(String(nextRole));
    } else if (requestedPermissions !== null) {
      nextPermissions = requestedPermissions;
    }
    if (permissionsWillChange) {
      after.permissions = [...nextPermissions].sort();
    }

    if (Object.keys(update).length === 0 && !permissionsWillChange) {
      return jsonError("No updatable fields supplied.", 400);
    }

    if (Object.keys(update).length > 0) {
      const { error } = await admin
        .from("profiles")
        .update(update)
        .eq("institute_id", actor.instituteId)
        .eq("id", id);
      if (error) return jsonError(error.message, 500);
    }

    if (permissionsWillChange && target.role !== "owner") {
      const permissionError = await replacePermissions(
        admin,
        actor.instituteId,
        id,
        nextPermissions
      );
      if (permissionError) return jsonError(permissionError.message, 500);
    }

    const action = roleChanged
      ? "user.role_change"
      : body.isDisabled === true
        ? "user.disable"
        : body.isDisabled === false
          ? "user.enable"
          : "user.update";

    const changedFields = Object.keys(after);
    await auditLog({
      supabase: admin,
      instituteId: actor.instituteId,
      actorUserId: actor.id,
      actorUsername: actor.username,
      action,
      resourceType: "User",
      resourceId: id,
      description:
        action === "user.role_change"
          ? `Changed role of "${target.username}" from ${target.role} to ${nextRole}`
          : action === "user.disable"
            ? `Disabled account "${target.username}"`
            : action === "user.enable"
              ? `Enabled account "${target.username}"`
              : `Updated account "${target.username}" (${changedFields.length} field${
                  changedFields.length === 1 ? "" : "s"
                })`,
      beforeData: Object.keys(before).length > 0 ? before : null,
      afterData: Object.keys(after).length > 0 ? after : null,
    });

    const profile = await loadProfile(actor.instituteId, id);
    return NextResponse.json({
      user: {
        id,
        fullName: String(profile?.full_name || ""),
        username: String(profile?.username || ""),
        role: profile?.role as Role,
        isDisabled: Boolean(profile?.is_disabled),
        permissions:
          profile?.role === "owner" ? [...ALL_PERMISSIONS] : [...nextPermissions],
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/admin/users/[id]
 * Removes the profile and the Supabase Auth user.
 * The owner account is never deletable.
 */
export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const actor = await requireUser(PERMISSIONS.USERS_EDIT);

    if (actor.role !== "owner") {
      return jsonError("Only the owner can delete accounts.", 403);
    }

    const { id } = await params;
    if (id === actor.id) {
      return jsonError("You cannot delete your own account.", 403);
    }

    const target = await loadProfile(actor.instituteId, id);
    if (!target) return jsonError("User not found.", 404);
    if (target.role === "owner") {
      return jsonError("The owner account cannot be deleted.", 403);
    }

    const admin = getSupabaseAdmin();

    // Remove permissions first, then profile, then auth user.
    await admin.from("user_permissions").delete().eq("user_id", id);

    const { error: profileError } = await admin
      .from("profiles")
      .delete()
      .eq("institute_id", actor.instituteId)
      .eq("id", id);

    if (profileError) return jsonError(profileError.message, 500);

    const { error: authError } = await admin.auth.admin.deleteUser(id);
    if (authError) {
      console.error("[users] auth delete failed:", authError.message);
    }

    await auditLog({
      supabase: admin,
      instituteId: actor.instituteId,
      actorUserId: actor.id,
      actorUsername: actor.username,
      action: "user.delete",
      resourceType: "User",
      resourceId: id,
      description: `Deleted account "${target.username}"`,
      beforeData: {
        username: target.username,
        full_name: target.full_name,
        role: target.role,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
