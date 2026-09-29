import { NextRequest, NextResponse } from "next/server";
import { requireUser, handleApiError, jsonError } from "@/lib/server/api";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { auditLog } from "@/lib/server/auditLog";
import type { Role } from "@/lib/types";

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

/**
 * PATCH /api/admin/users/[id]
 * Updates name, role (admin/staff only) or disabled flag.
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

    if (body.role !== undefined) {
      const nextRole = String(body.role) as Role;
      if (target.role === "owner") {
        return jsonError("The owner account cannot be demoted.", 403);
      }
      if (nextRole === "owner") {
        return jsonError("Accounts cannot be promoted to owner.", 403);
      }
      if (nextRole !== "admin" && nextRole !== "staff") {
        return jsonError("Role must be admin or staff.", 400);
      }
      update.role = nextRole;
      before.role = target.role;
      after.role = nextRole;
    }

    if (body.isDisabled !== undefined) {
      if (target.role === "owner" && body.isDisabled) {
        return jsonError("The owner account cannot be disabled.", 403);
      }
      update.is_disabled = Boolean(body.isDisabled);
      before.is_disabled = target.is_disabled;
      after.is_disabled = update.is_disabled;
    }

    if (Object.keys(update).length === 0) {
      return jsonError("No updatable fields supplied.", 400);
    }

    const { data, error } = await admin
      .from("profiles")
      .update(update)
      .eq("institute_id", actor.instituteId)
      .eq("id", id)
      .select("id, full_name, username, role, is_disabled")
      .single();

    if (error) return jsonError(error.message, 500);

    await auditLog({
      supabase: admin,
      instituteId: actor.instituteId,
      actorUserId: actor.id,
      actorUsername: actor.username,
      action: "USER_UPDATE",
      resourceType: "User",
      resourceId: id,
      description: `Updated account "${target.username}"`,
      beforeData: before,
      afterData: after,
    });

    return NextResponse.json({
      user: {
        id: data.id,
        fullName: data.full_name || "",
        username: data.username || "",
        role: data.role as Role,
        isDisabled: data.is_disabled,
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
      action: "USER_DELETE",
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
