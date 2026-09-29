import { ApiError, fields, type AnySupabase, type CrudConfig } from "@/lib/server/crud";
import type { AuthUser } from "@/lib/server/authorization";
import { PERMISSIONS } from "@/lib/constants/permissions";

const SELECT =
  "id, institute_id, name, slug, address, phone, email, maps_url, opening_hours, is_active, display_order, created_at, updated_at";

export const BRANCH_SELECT = SELECT;

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

async function assertOwnedIds(
  supabase: AnySupabase,
  user: AuthUser,
  table: "courses" | "faculty",
  ids: string[]
) {
  for (const id of ids) {
    const { data } = await supabase
      .from(table)
      .select("id")
      .eq("institute_id", user.instituteId)
      .eq("id", id)
      .maybeSingle();
    if (!data) {
      throw new ApiError(400, `Selected ${table === "courses" ? "course" : "faculty"} does not exist.`);
    }
  }
}

async function replaceAssociations(
  supabase: AnySupabase,
  user: AuthUser,
  branchId: string,
  table: "branch_courses" | "branch_faculty",
  idColumn: "course_id" | "faculty_id",
  ids: string[]
) {
  const { error: deleteError } = await supabase
    .from(table)
    .delete()
    .eq("institute_id", user.instituteId)
    .eq("branch_id", branchId);
  if (deleteError) throw new ApiError(500, deleteError.message);

  if (ids.length === 0) return;

  const { error } = await supabase.from(table).insert(
    ids.map((id) => ({
      institute_id: user.instituteId,
      branch_id: branchId,
      [idColumn]: id,
    }))
  );
  if (error) throw new ApiError(500, error.message);
}

async function associationNames(
  supabase: AnySupabase,
  branchId: string
): Promise<{ courses: string; faculty: string }> {
  const [coursesResult, facultyResult] = await Promise.all([
    supabase.from("branch_courses").select("course_id, courses(title)").eq("branch_id", branchId),
    supabase.from("branch_faculty").select("faculty_id, faculty(name)").eq("branch_id", branchId),
  ]);

  const courses = (coursesResult.data || [])
    .flatMap((row: { courses?: { title: string }[] | { title: string } | null }) => {
      const value = row.courses;
      if (!value) return [];
      return Array.isArray(value) ? value.map((item) => item.title) : [value.title];
    })
    .filter(Boolean)
    .join(", ");
  const faculty = (facultyResult.data || [])
    .flatMap((row: { faculty?: { name: string }[] | { name: string } | null }) => {
      const value = row.faculty;
      if (!value) return [];
      return Array.isArray(value) ? value.map((item) => item.name) : [value.name];
    })
    .filter(Boolean)
    .join(", ");

  return { courses, faculty };
}

function readBody(
  body: Record<string, unknown>,
  partial: boolean,
  user: AuthUser
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  const pick = (key: string) => !partial || body[key] !== undefined;

  if (pick("name")) {
    const name = fields.text(body.name);
    if (!name) throw new ApiError(400, "Branch name is required.");
    payload.name = name;
    if (!partial || body.slug === undefined) payload.slug = slugify(name);
  }
  if (pick("slug")) {
    const slug = slugify(fields.text(body.slug));
    if (slug) payload.slug = slug;
  }
  if (pick("address")) payload.address = fields.raw(body.address);
  if (pick("phone")) payload.phone = fields.raw(body.phone);
  if (pick("email")) payload.email = fields.raw(body.email);
  if (pick("maps_url")) payload.maps_url = fields.raw(body.maps_url);
  if (pick("opening_hours")) payload.opening_hours = fields.raw(body.opening_hours);
  if (pick("is_active")) payload.is_active = fields.bool(body.is_active, true);
  if (pick("display_order")) payload.display_order = fields.int(body.display_order, 0);

  if (payload.email && !String(payload.email).includes("@")) {
    throw new ApiError(400, "Enter a valid email address.");
  }

  void user;
  return payload;
}

async function assertSlugAvailable(
  supabase: AnySupabase,
  user: AuthUser,
  slug: string,
  excludeId?: string
) {
  if (!slug) return;
  let query = supabase
    .from("branches")
    .select("id")
    .eq("institute_id", user.instituteId)
    .eq("slug", slug);
  if (excludeId) query = query.neq("id", excludeId);
  const { data } = await query.maybeSingle();
  if (data) throw new ApiError(409, "A branch with this slug already exists.");
}

export const branchResource: CrudConfig = {
  table: "branches",
  permissions: {
    view: PERMISSIONS.BRANCHES_VIEW,
    create: PERMISSIONS.BRANCHES_CREATE,
    edit: PERMISSIONS.BRANCHES_EDIT,
    delete: PERMISSIONS.BRANCHES_DELETE,
  },
  resourceType: "Branch",
  auditPrefix: "branch",
  select: SELECT,
  order: [
    { column: "display_order", ascending: true },
    { column: "name", ascending: true },
  ],
  searchColumns: ["name", "address", "email"],
  filters: [
    { column: "is_active", param: "active", map: (raw) => raw === "1" },
  ],
  label: (row) => String(row.name || "Untitled branch"),
  buildInsert: async ({ supabase, user, body }) => {
    const payload = readBody(body, false, user);
    await assertSlugAvailable(supabase, user, String(payload.slug || ""));

    const courseIds = fields.list(body.course_ids);
    const facultyIds = fields.list(body.faculty_ids);
    await assertOwnedIds(supabase, user, "courses", courseIds);
    await assertOwnedIds(supabase, user, "faculty", facultyIds);
    return payload;
  },
  buildUpdate: async ({ supabase, user, body, before }) => {
    const payload = readBody(body, true, user);
    if (before && payload.slug !== undefined && payload.slug !== before.slug) {
      await assertSlugAvailable(supabase, user, String(payload.slug), String(before.id));
    }

    if (body.course_ids !== undefined) {
      await assertOwnedIds(supabase, user, "courses", fields.list(body.course_ids));
    }
    if (body.faculty_ids !== undefined) {
      await assertOwnedIds(supabase, user, "faculty", fields.list(body.faculty_ids));
    }
    return payload;
  },
  hooks: {
    afterInsert: async ({ supabase, user, body, row }) => {
      const courseIds = fields.list(body.course_ids);
      const facultyIds = fields.list(body.faculty_ids);
      if (courseIds.length) {
        await replaceAssociations(supabase, user, String(row.id), "branch_courses", "course_id", courseIds);
      }
      if (facultyIds.length) {
        await replaceAssociations(supabase, user, String(row.id), "branch_faculty", "faculty_id", facultyIds);
      }
    },
    afterUpdate: async ({ supabase, user, body, row }) => {
      if (body.course_ids !== undefined) {
        await replaceAssociations(
          supabase,
          user,
          String(row.id),
          "branch_courses",
          "course_id",
          fields.list(body.course_ids)
        );
      }
      if (body.faculty_ids !== undefined) {
        await replaceAssociations(
          supabase,
          user,
          String(row.id),
          "branch_faculty",
          "faculty_id",
          fields.list(body.faculty_ids)
        );
      }
    },
    afterDelete: async ({ supabase, user, before }) => {
      await replaceAssociations(supabase, user, String(before.id), "branch_courses", "course_id", []);
      await replaceAssociations(supabase, user, String(before.id), "branch_faculty", "faculty_id", []);
    },
  },
  augmentSnapshot: async ({ supabase, row, snapshot }) => {
    const { courses, faculty } = await associationNames(supabase, String(row.id));
    return { ...snapshot, courses, faculty };
  },
};
