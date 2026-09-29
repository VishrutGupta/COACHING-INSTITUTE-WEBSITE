import { NextResponse } from "next/server";
import { requireUser, handleApiError } from "@/lib/server/api";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PERMISSIONS } from "@/lib/constants/permissions";

/**
 * GET /api/admin/dashboard — real counts only (no fabricated stats).
 */
export async function GET() {
  try {
    const user = await requireUser(PERMISSIONS.DASHBOARD_VIEW);
    const supabase = await createSupabaseServerClient();

    const [courses, activeCourses, faculty, activeFaculty, subjects, recent] =
      await Promise.all([
        supabase
          .from("courses")
          .select("id", { count: "exact", head: true })
          .eq("institute_id", user.instituteId),
        supabase
          .from("courses")
          .select("id", { count: "exact", head: true })
          .eq("institute_id", user.instituteId)
          .eq("is_active", true),
        supabase
          .from("faculty")
          .select("id", { count: "exact", head: true })
          .eq("institute_id", user.instituteId),
        supabase
          .from("faculty")
          .select("id", { count: "exact", head: true })
          .eq("institute_id", user.instituteId)
          .eq("is_active", true),
        supabase
          .from("subjects")
          .select("id", { count: "exact", head: true })
          .eq("institute_id", user.instituteId)
          .eq("is_active", true),
        supabase
          .from("audit_logs")
          .select("id, action, resource_type, description, actor_username, created_at")
          .eq("institute_id", user.instituteId)
          .order("created_at", { ascending: false })
          .limit(8),
      ]);

    return NextResponse.json({
      counts: {
        courses: courses.count || 0,
        activeCourses: activeCourses.count || 0,
        faculty: faculty.count || 0,
        activeFaculty: activeFaculty.count || 0,
        subjects: subjects.count || 0,
      },
      recentActivity: recent.data || [],
    });
  } catch (error) {
    return handleApiError(error);
  }
}
