import { NextRequest, NextResponse } from "next/server";
import { requireUser, handleApiError, jsonError } from "@/lib/server/api";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { auditLog } from "@/lib/server/auditLog";

/**
 * GET /api/admin/courses/[id]/faculty
 * Current faculty mapping for a course.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser(PERMISSIONS.COURSES_VIEW);
    const supabase = await createSupabaseServerClient();
    const { id } = await params;

    const { data, error } = await supabase
      .from("course_faculty")
      .select("id, faculty_id, subject_id, display_order")
      .eq("institute_id", user.instituteId)
      .eq("course_id", id)
      .order("display_order", { ascending: true });

    if (error) return jsonError(error.message, 500);

    return NextResponse.json({ mappings: data || [] });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PUT /api/admin/courses/[id]/faculty
 * Replaces the mapping set in one atomic operation.
 * Body: { items: [{ faculty_id, subject_id?, display_order? }] }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser(PERMISSIONS.COURSES_EDIT);
    const supabase = await createSupabaseServerClient();
    const { id } = await params;

    const body = await request.json();
    const items: { faculty_id?: string; subject_id?: string | null; display_order?: number }[] =
      Array.isArray(body.items) ? body.items : [];

    const { data: course } = await supabase
      .from("courses")
      .select("id, title")
      .eq("institute_id", user.instituteId)
      .eq("id", id)
      .maybeSingle();

    if (!course) return jsonError("Course not found.", 404);

    const { data: beforeRows } = await supabase
      .from("course_faculty")
      .select("id, faculty_id, subject_id, display_order")
      .eq("institute_id", user.instituteId)
      .eq("course_id", id);

    const { error: deleteError } = await supabase
      .from("course_faculty")
      .delete()
      .eq("institute_id", user.instituteId)
      .eq("course_id", id);

    if (deleteError) return jsonError(deleteError.message, 500);

    const rows = items
      .filter((item) => item.faculty_id)
      .map((item, index) => ({
        institute_id: user.instituteId,
        course_id: id,
        faculty_id: item.faculty_id as string,
        subject_id: item.subject_id || null,
        display_order: Number(item.display_order) || index,
      }));

    if (rows.length > 0) {
      const { error: insertError } = await supabase.from("course_faculty").insert(rows);
      if (insertError) return jsonError(insertError.message, 500);
    }

    await auditLog({
      supabase,
      instituteId: user.instituteId,
      actorUserId: user.id,
      actorUsername: user.username,
      action: "COURSE_UPDATE",
      resourceType: "CourseFaculty",
      resourceId: id,
      description: `Updated faculty mapping for "${course.title}" (${rows.length} entr${
        rows.length === 1 ? "y" : "ies"
      })`,
      beforeData: { mappings: beforeRows || [] },
      afterData: { mappings: rows },
    });

    return NextResponse.json({ success: true, count: rows.length });
  } catch (error) {
    return handleApiError(error);
  }
}
