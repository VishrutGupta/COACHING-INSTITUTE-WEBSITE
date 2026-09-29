import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasPermission, type AuthUser } from "@/lib/server/authorization";
import { PERMISSIONS } from "@/lib/constants/permissions";

export interface LookupOption {
  value: string;
  label: string;
}

/**
 * Option lists for selects, filters and pickers.
 * Each list is only fetched when the caller actually holds that module's
 * view permission, so lookups never become a permission bypass.
 * Keys match form field names: course_id, faculty_id, branch_id, …
 */
export async function lookupOptions(user: AuthUser): Promise<Record<string, LookupOption[]>> {
  const empty: Record<string, LookupOption[]> = {
    course_id: [],
    faculty_id: [],
    branch_id: [],
    batch_id: [],
    subject_id: [],
    album_id: [],
    assigned_to: [],
  };

  try {
    const supabase = await createSupabaseServerClient();

    const requests: { key: string; table: string; label: string; permission: string }[] = [
      { key: "course_id", table: "courses", label: "title", permission: PERMISSIONS.COURSES_VIEW },
      { key: "faculty_id", table: "faculty", label: "name", permission: PERMISSIONS.FACULTY_VIEW },
      { key: "branch_id", table: "branches", label: "name", permission: PERMISSIONS.BRANCHES_VIEW },
      { key: "batch_id", table: "batches", label: "name", permission: PERMISSIONS.BATCHES_VIEW },
      { key: "subject_id", table: "subjects", label: "name", permission: PERMISSIONS.SUBJECTS_VIEW },
      { key: "album_id", table: "gallery_albums", label: "title", permission: PERMISSIONS.GALLERY_VIEW },
      { key: "assigned_to", table: "profiles", label: "username", permission: PERMISSIONS.USERS_VIEW },
    ];

    const results = await Promise.all(
      requests.map(async (request) => {
        if (!hasPermission(user, request.permission)) return null;

        const column = request.table === "profiles" ? "username" : "name";
        const select =
          request.table === "profiles"
            ? "id, username, full_name, is_disabled"
            : `id, ${request.label}, is_active`;

        let query = supabase
          .from(request.table)
          .select(select)
          .eq("institute_id", user.instituteId)
          .order(column === "username" ? "username" : request.label, { ascending: true });

        if (request.table !== "profiles") {
          query = query.eq("is_active", true);
        }

        const { data, error } = await query;
        if (error) return null;

        const rows = (data || []) as unknown as Record<string, unknown>[];
        return {
          key: request.key,
          options: rows.map((row) => ({
            value: String(row.id),
            label:
              request.table === "profiles"
                ? `${String(row.full_name || row.username)} (@${String(row.username)})`
                : String(row[request.label] || ""),
          })),
        };
      })
    );

    for (const result of results) {
      if (result) empty[result.key] = result.options;
    }
  } catch {
    // Lookups are optional — forms fall back to empty selects.
  }

  return empty;
}
