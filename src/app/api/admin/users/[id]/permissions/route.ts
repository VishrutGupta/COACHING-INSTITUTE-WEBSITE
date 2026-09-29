import { NextRequest, NextResponse } from "next/server";
import { requireUser, handleApiError, jsonError } from "@/lib/server/api";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { PERMISSIONS, ALL_PERMISSIONS } from "@/lib/constants/permissions";
import { auditLog } from "@/lib/server/auditLog";

type Params = { params: Promise<{ id: string }> };

/** GET /api/admin/users/[id]/permissions */
export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const actor = await requireUser(PERMISSIONS.USERS_VIEW);
    const { id } = await params;
    const admin = getSupabaseAdmin();

    const { data: profile } = await admin
      .from("profiles")
      .select("id, role, username")
      .eq("institute_id", actor.instituteId)
      .eq("id", id)
      .maybeSingle();

    if (!profile) return jsonError("User not found.", 404);

    if (profile.role === "owner") {
      return NextResponse.json({ role: profile.role, permissions: [...ALL_PERMISSIONS] });
    }

    const { data: rows } = await admin
      .from("user_permissions")
      .select("permission")
      .eq("institute_id", actor.instituteId)
      .eq("user_id", id);

    return NextResponse.json({
      role: profile.role,
      permissions: (rows || []).map((row) => row.permission as string),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PUT /api/admin/users/[id]/permissions
 * Body: { permissions: string[] }
 * Replaces the grant set for an ADMIN/STAFF user. Owner is immutable.
 */
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const actor = await requireUser(PERMISSIONS.USERS_EDIT);

    if (actor.role !== "owner") {
      return jsonError("Only the owner can change permissions.", 403);
    }

    const { id } = await params;
    const body = await request.json();
    const requested: string[] = Array.isArray(body.permissions) ? body.permissions : [];

    const invalid = requested.find(
      (permission) => !(ALL_PERMISSIONS as string[]).includes(permission)
    );
    if (invalid) return jsonError(`Unknown permission: ${invalid}`, 400);

    const admin = getSupabaseAdmin();

    const { data: profile } = await admin
      .from("profiles")
      .select("id, role, username")
      .eq("institute_id", actor.instituteId)
      .eq("id", id)
      .maybeSingle();

    if (!profile) return jsonError("User not found.", 404);
    if (profile.role === "owner") {
      return jsonError("Owner permissions cannot be changed.", 403);
    }

    const { data: existingRows } = await admin
      .from("user_permissions")
      .select("permission")
      .eq("institute_id", actor.instituteId)
      .eq("user_id", id);

    const existing = (existingRows || []).map((row) => row.permission as string);
    const toAdd = requested.filter((permission) => !existing.includes(permission));
    const toRemove = existing.filter((permission) => !requested.includes(permission));

    if (toRemove.length > 0) {
      const { error } = await admin
        .from("user_permissions")
        .delete()
        .eq("institute_id", actor.instituteId)
        .eq("user_id", id)
        .in("permission", toRemove);
      if (error) return jsonError(error.message, 500);
    }

    if (toAdd.length > 0) {
      const rows = toAdd.map((permission) => ({
        user_id: id,
        institute_id: actor.instituteId,
        permission,
      }));
      const { error } = await admin.from("user_permissions").insert(rows);
      if (error) return jsonError(error.message, 500);
    }

    if (toAdd.length > 0 || toRemove.length > 0) {
      await auditLog({
        supabase: admin,
        instituteId: actor.instituteId,
        actorUserId: actor.id,
        actorUsername: actor.username,
        action: "USER_UPDATE",
        resourceType: "UserPermission",
        resourceId: id,
        description: `Updated permissions for "${profile.username}" (${requested.length} granted)`,
        beforeData: { permissions: existing.sort() },
        afterData: { permissions: [...requested].sort() },
        metadata: { added: toAdd, removed: toRemove },
      });
    }

    return NextResponse.json({ permissions: requested });
  } catch (error) {
    return handleApiError(error);
  }
}
