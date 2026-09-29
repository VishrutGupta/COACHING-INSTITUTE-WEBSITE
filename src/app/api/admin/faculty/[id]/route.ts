import { NextRequest, NextResponse } from "next/server";
import { requireUser, handleApiError, jsonError } from "@/lib/server/api";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { auditLog } from "@/lib/server/auditLog";
import { diffSnapshots } from "@/lib/utils/auditDiff";

const FACULTY_SELECT =
  "id, institute_id, name, slug, designation, subject, qualification, experience, bio, specialization, achievements, profile_image, linkedin_url, social_links, display_order, is_active, featured, created_at, updated_at";

const EDITABLE_FIELDS: Record<string, (value: unknown) => unknown> = {
  name: (v) => String(v ?? "").trim(),
  designation: (v) => String(v ?? ""),
  subject: (v) => String(v ?? ""),
  qualification: (v) => String(v ?? ""),
  experience: (v) => String(v ?? ""),
  bio: (v) => String(v ?? ""),
  specialization: (v) => String(v ?? ""),
  achievements: (v) => String(v ?? ""),
  profile_image: (v) => (v ? String(v) : null),
  linkedin_url: (v) => String(v ?? ""),
  social_links: (v) => (v && typeof v === "object" ? v : {}),
  display_order: (v) => Number(v) || 0,
  is_active: (v) => Boolean(v),
  featured: (v) => Boolean(v),
};

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const user = await requireUser(PERMISSIONS.FACULTY_VIEW);
    const supabase = await createSupabaseServerClient();
    const { id } = await params;

    const { data, error } = await supabase
      .from("faculty")
      .select(FACULTY_SELECT)
      .eq("institute_id", user.instituteId)
      .eq("id", id)
      .maybeSingle();

    if (error) return jsonError(error.message, 500);
    if (!data) return jsonError("Faculty member not found.", 404);

    return NextResponse.json({ faculty: data });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const user = await requireUser(PERMISSIONS.FACULTY_EDIT);
    const supabase = await createSupabaseServerClient();
    const { id } = await params;

    const body = await request.json();

    const { data: before, error: beforeError } = await supabase
      .from("faculty")
      .select("*")
      .eq("institute_id", user.instituteId)
      .eq("id", id)
      .maybeSingle();

    if (beforeError) return jsonError(beforeError.message, 500);
    if (!before) return jsonError("Faculty member not found.", 404);

    const payload: Record<string, unknown> = {};
    for (const [key, mapper] of Object.entries(EDITABLE_FIELDS)) {
      if (body[key] !== undefined) payload[key] = mapper(body[key]);
    }

    if (Object.keys(payload).length === 0) {
      return jsonError("No updatable fields supplied.", 400);
    }

    const { data, error } = await supabase
      .from("faculty")
      .update(payload)
      .eq("institute_id", user.instituteId)
      .eq("id", id)
      .select(FACULTY_SELECT)
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
        action: "FACULTY_UPDATE",
        resourceType: "Faculty",
        resourceId: id,
        description: `Updated faculty member "${data.name}" (${changes.length} field${
          changes.length === 1 ? "" : "s"
        })`,
        beforeData: Object.fromEntries(changes.map((c) => [c.field, c.before])),
        afterData: Object.fromEntries(changes.map((c) => [c.field, c.after])),
      });
    }

    return NextResponse.json({ faculty: data, changed: changes.length });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const user = await requireUser(PERMISSIONS.FACULTY_DELETE);
    const supabase = await createSupabaseServerClient();
    const { id } = await params;

    const { data: before, error: beforeError } = await supabase
      .from("faculty")
      .select("*")
      .eq("institute_id", user.instituteId)
      .eq("id", id)
      .maybeSingle();

    if (beforeError) return jsonError(beforeError.message, 500);
    if (!before) return jsonError("Faculty member not found.", 404);

    const { error } = await supabase
      .from("faculty")
      .delete()
      .eq("institute_id", user.instituteId)
      .eq("id", id);

    if (error) return jsonError(error.message, 500);

    await auditLog({
      supabase,
      instituteId: user.instituteId,
      actorUserId: user.id,
      actorUsername: user.username,
      action: "FACULTY_DELETE",
      resourceType: "Faculty",
      resourceId: id,
      description: `Removed faculty member "${before.name}"`,
      beforeData: before as unknown as Record<string, unknown>,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
