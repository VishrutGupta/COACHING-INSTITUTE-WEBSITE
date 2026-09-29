import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasPermission, type AuthUser } from "@/lib/server/authorization";
import { PERMISSIONS } from "@/lib/constants/permissions";

export interface DashboardCounts {
  courses: number;
  activeCourses: number;
  faculty: number;
  activeFaculty: number;
  subjects: number;
  batches: number;
  activeBatches: number;
  classes: number;
  newEnquiries: number;
  openEnquiries: number;
  announcements: number;
  results: number;
  branches: number;
  galleryItems: number;
}

export interface ActivityRow {
  id: string;
  action: string;
  resource_type: string;
  description: string;
  actor_username: string;
  created_at: string;
}

export const EMPTY_DASHBOARD_COUNTS: DashboardCounts = {
  courses: 0,
  activeCourses: 0,
  faculty: 0,
  activeFaculty: 0,
  subjects: 0,
  batches: 0,
  activeBatches: 0,
  classes: 0,
  newEnquiries: 0,
  openEnquiries: 0,
  announcements: 0,
  results: 0,
  branches: 0,
  galleryItems: 0,
};

type CountQuery = Promise<{ count: number | null; error: { message: string } | null }>;

async function headCount(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  user: AuthUser,
  table: string,
  filters: { column: string; value: string | boolean }[] = []
): CountQuery {
  let query = supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("institute_id", user.instituteId);
  for (const filter of filters) {
    query = query.eq(filter.column, filter.value);
  }
  return query;
}

/** Real dashboard counts, each gated by the caller's own permissions. */
export async function loadDashboard(user: AuthUser): Promise<{
  counts: DashboardCounts;
  recent: ActivityRow[];
  error: boolean;
}> {
  const counts: DashboardCounts = { ...EMPTY_DASHBOARD_COUNTS };
  let recent: ActivityRow[] = [];
  let error = false;

  if (!hasPermission(user, PERMISSIONS.DASHBOARD_VIEW)) {
    return { counts, recent, error };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const can = (permission: string) => hasPermission(user, permission);

    const results = await Promise.all([
      headCount(supabase, user, "courses"),
      headCount(supabase, user, "courses", [{ column: "is_active", value: true }]),
      headCount(supabase, user, "faculty"),
      headCount(supabase, user, "faculty", [{ column: "is_active", value: true }]),
      headCount(supabase, user, "subjects", [{ column: "is_active", value: true }]),
      can(PERMISSIONS.BATCHES_VIEW) ? headCount(supabase, user, "batches") : null,
      can(PERMISSIONS.BATCHES_VIEW)
        ? headCount(supabase, user, "batches", [{ column: "is_active", value: true }])
        : null,
      can(PERMISSIONS.SCHEDULE_VIEW)
        ? headCount(supabase, user, "schedule_entries", [{ column: "is_active", value: true }])
        : null,
      can(PERMISSIONS.ENQUIRIES_VIEW)
        ? headCount(supabase, user, "enquiries", [{ column: "status", value: "new" }])
        : null,
      can(PERMISSIONS.ANNOUNCEMENTS_VIEW)
        ? headCount(supabase, user, "announcements", [{ column: "is_active", value: true }])
        : null,
      can(PERMISSIONS.RESULTS_VIEW)
        ? headCount(supabase, user, "results", [{ column: "is_active", value: true }])
        : null,
      can(PERMISSIONS.BRANCHES_VIEW)
        ? headCount(supabase, user, "branches", [{ column: "is_active", value: true }])
        : null,
      can(PERMISSIONS.GALLERY_VIEW)
        ? headCount(supabase, user, "gallery_items", [{ column: "is_active", value: true }])
        : null,
      supabase
        .from("audit_logs")
        .select("id, action, resource_type, description, actor_username, created_at")
        .eq("institute_id", user.instituteId)
        .order("created_at", { ascending: false })
        .limit(8),
    ]);

    const value = (result: { count: number | null } | null) => result?.count || 0;

    counts.courses = value(results[0] as { count: number | null });
    counts.activeCourses = value(results[1] as { count: number | null });
    counts.faculty = value(results[2] as { count: number | null });
    counts.activeFaculty = value(results[3] as { count: number | null });
    counts.subjects = value(results[4] as { count: number | null });
    counts.batches = value(results[5] as { count: number | null });
    counts.activeBatches = value(results[6] as { count: number | null });
    counts.classes = value(results[7] as { count: number | null });
    counts.newEnquiries = value(results[8] as { count: number | null });
    counts.announcements = value(results[9] as { count: number | null });
    counts.results = value(results[10] as { count: number | null });
    counts.branches = value(results[11] as { count: number | null });
    counts.galleryItems = value(results[12] as { count: number | null });

    if (can(PERMISSIONS.ENQUIRIES_VIEW)) {
      const openQuery = await supabase
        .from("enquiries")
        .select("id, status")
        .eq("institute_id", user.instituteId);
      const rows = (openQuery.data || []) as { status: string }[];
      counts.openEnquiries = rows.filter(
        (row) => row.status !== "converted" && row.status !== "closed"
      ).length;
    }

    const recentResult = results[13] as { data: ActivityRow[] | null; error: unknown };
    if (recentResult.error) error = true;
    recent = recentResult.data || [];
  } catch {
    error = true;
  }

  return { counts, recent, error };
}
