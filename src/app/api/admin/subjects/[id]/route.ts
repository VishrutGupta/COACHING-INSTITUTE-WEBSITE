import { NextRequest, NextResponse } from "next/server";
import { requireUser, handleApiError, jsonError } from "@/lib/server/api";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { auditLog } from "@/lib/server/auditLog";
import { diffSnapshots } from "@/lib/utils/auditDiff";

const SUBJECT_SELECT = "id, institute_id, name, slug, description, display_order, is_active, created_at, updated_at";

const EDITABLE_FIELDS: Record<string, (value: unknown) => unknown> = {
  name: (v) => String(v ?? "").trim(),
  description: (v) => String(v ?? ""),
  display_order: (v) => Number(v) || 0,
  is_active: (v) => Boolean(v),
};

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const user = await requireUser(PERMISSIONS.SUBJECTS_EDIT);
    const supabase = await createSupabaseServerClient();
    const { id } = await params;

    const body = await request.json();

    const { data: before, error: beforeError } = await supabase
      .from("subjects")
      .select("*")
      .eq("institute_id", user.instituteId)
      .eq("id", id)
      .maybeSingle();

    if (beforeError) return jsonError(beforeError.message, 500);
    if (!before) return jsonError("Subject not found.", 404);

    const payload: Record<string, unknown> = {};
    for (const [key, mapper] of Object.entries(EDITABLE_FIELDS)) {
      if (body[key] !== undefined) payload[key] = mapper(body[key]);
    }

    if (Object.keys(payload).length === 0) {
      return jsonError("No updatable fields supplied.", 400);
    }

    const { data, error } = await supabase
      .from("subjects")
      .update(payload)
      .eq("institute_id", user.instituteId)
      .eq("id", id)
      .select(SUBJECT_SELECT)
      .single();

    if (error) return jsonError(error.message, 500);

    const changes = diffSnapshots(
      before as unknown as Record<string, unknown>,
      data as unknown as Record<string, unknown>
    );

    if (changes.length > 0) {
      await auditLog({
        supabase,
        instituteId: user.instituteId,
        actorUserId: user.id,
        actorUsername: user.username,
        action: "SUBJECT_UPDATE",
        resourceType: "Subject",
        resourceId: id,
        description: `Updated subject "${data.name}" (${changes.length} field${
          changes.length === 1 ? "" : "s"
        })`,
        beforeData: Object.fromEntries(changes.map((c) => [c.field, c.before])),
        afterData: Object.fromEntries(changes.map((c) => [c.field, c.after])),
      });
    }

    return NextResponse.json({ subject: data, changed: changes.length });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const user = await requireUser(PERMISSIONS.SUBJECTS_DELETE);
    const supabase = await createSupabaseServerClient();
    const { id } = await params;

    const { data: before, error: beforeError } = await supabase
      .from("subjects")
      .select("*")
      .eq("institute_id", user.instituteId)
      .eq("id", id)
      .maybeSingle();

    if (beforeError) return jsonError(beforeError.message, 500);
    if (!before) return jsonError("Subject not found.", 404);

    const { error } = await supabase
      .from("subjects")
      .delete()
      .eq("institute_id", user.instituteId)
      .eq("id", id);

    if (error) return jsonError(error.message, 500);

    await auditLog({
      supabase,
      instituteId: user.instituteId,
      actorUserId: user.id,
      actorUsername: user.username,
      action: "SUBJECT_DELETE",
      resourceType: "Subject",
      resourceId: id,
      description: `Deleted subject "${before.name}"`,
      beforeData: before as unknown as Record<string, unknown>,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
