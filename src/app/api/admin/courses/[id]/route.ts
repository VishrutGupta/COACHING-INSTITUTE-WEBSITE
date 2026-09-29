import { NextRequest, NextResponse } from "next/server";
import { requireUser, handleApiError, jsonError } from "@/lib/server/api";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { auditLog } from "@/lib/server/auditLog";
import { diffSnapshots } from "@/lib/utils/auditDiff";

const COURSE_SELECT =
  "id, institute_id, title, slug, short_description, description, category, exam, target_audience, duration, fee, original_price, discount, mode, start_date, end_date, cover_image_url, gallery_urls, brochure_url, highlights, syllabus, eligibility, featured, is_active, display_order, whatsapp_number, seo_title, seo_description, created_at, updated_at";

const EDITABLE_FIELDS: Record<string, (value: unknown) => unknown> = {
  title: (v) => String(v ?? "").trim(),
  short_description: (v) => String(v ?? ""),
  description: (v) => String(v ?? ""),
  category: (v) => String(v ?? ""),
  exam: (v) => String(v ?? ""),
  target_audience: (v) => String(v ?? ""),
  duration: (v) => String(v ?? ""),
  fee: (v) => Number(v) || 0,
  original_price: (v) => (v === null || v === "" || v === undefined ? null : Number(v)),
  discount: (v) => String(v ?? ""),
  mode: (v) => (["Online", "Offline", "Hybrid"].includes(String(v)) ? String(v) : "Offline"),
  start_date: (v) => (v ? String(v) : null),
  end_date: (v) => (v ? String(v) : null),
  cover_image_url: (v) => (v ? String(v) : null),
  gallery_urls: (v) => (Array.isArray(v) ? v : []),
  brochure_url: (v) => (v ? String(v) : null),
  highlights: (v) => (Array.isArray(v) ? v : []),
  syllabus: (v) => (Array.isArray(v) ? v : []),
  eligibility: (v) => String(v ?? ""),
  featured: (v) => Boolean(v),
  is_active: (v) => Boolean(v),
  display_order: (v) => Number(v) || 0,
  whatsapp_number: (v) => String(v ?? ""),
  seo_title: (v) => String(v ?? ""),
  seo_description: (v) => String(v ?? ""),
};

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const user = await requireUser(PERMISSIONS.COURSES_VIEW);
    const supabase = await createSupabaseServerClient();
    const { id } = await params;

    const { data, error } = await supabase
      .from("courses")
      .select(COURSE_SELECT)
      .eq("institute_id", user.instituteId)
      .eq("id", id)
      .maybeSingle();

    if (error) return jsonError(error.message, 500);
    if (!data) return jsonError("Course not found.", 404);

    return NextResponse.json({ course: data });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const user = await requireUser(PERMISSIONS.COURSES_EDIT);
    const supabase = await createSupabaseServerClient();
    const { id } = await params;

    const body = await request.json();

    const { data: before, error: beforeError } = await supabase
      .from("courses")
      .select("*")
      .eq("institute_id", user.instituteId)
      .eq("id", id)
      .maybeSingle();

    if (beforeError) return jsonError(beforeError.message, 500);
    if (!before) return jsonError("Course not found.", 404);

    const payload: Record<string, unknown> = {};
    for (const [key, mapper] of Object.entries(EDITABLE_FIELDS)) {
      if (body[key] !== undefined) payload[key] = mapper(body[key]);
    }

    if (Object.keys(payload).length === 0) {
      return jsonError("No updatable fields supplied.", 400);
    }

    const { data, error } = await supabase
      .from("courses")
      .update(payload)
      .eq("institute_id", user.instituteId)
      .eq("id", id)
      .select(COURSE_SELECT)
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
        action: "COURSE_UPDATE",
        resourceType: "Course",
        resourceId: id,
        description: `Updated course "${data.title}" (${changes.length} field${
          changes.length === 1 ? "" : "s"
        })`,
        beforeData: Object.fromEntries(changes.map((c) => [c.field, c.before])),
        afterData: Object.fromEntries(changes.map((c) => [c.field, c.after])),
      });
    }

    return NextResponse.json({ course: data, changed: changes.length });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const user = await requireUser(PERMISSIONS.COURSES_DELETE);
    const supabase = await createSupabaseServerClient();
    const { id } = await params;

    const { data: before, error: beforeError } = await supabase
      .from("courses")
      .select("*")
      .eq("institute_id", user.instituteId)
      .eq("id", id)
      .maybeSingle();

    if (beforeError) return jsonError(beforeError.message, 500);
    if (!before) return jsonError("Course not found.", 404);

    const { error } = await supabase
      .from("courses")
      .delete()
      .eq("institute_id", user.instituteId)
      .eq("id", id);

    if (error) return jsonError(error.message, 500);

    await auditLog({
      supabase,
      instituteId: user.instituteId,
      actorUserId: user.id,
      actorUsername: user.username,
      action: "COURSE_DELETE",
      resourceType: "Course",
      resourceId: id,
      description: `Deleted course "${before.title}"`,
      beforeData: before as unknown as Record<string, unknown>,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
