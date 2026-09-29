import { ApiError, fields, type CrudConfig } from "@/lib/server/crud";
import { PERMISSIONS } from "@/lib/constants/permissions";

const SELECT =
  "id, institute_id, name, role, photo_url, content, rating, course, year, featured, display_order, is_active, created_at, updated_at";

export const TESTIMONIAL_SELECT = SELECT;

function readBody(body: Record<string, unknown>, partial: boolean): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  const pick = (key: string) => !partial || body[key] !== undefined;

  if (pick("name")) {
    const name = fields.text(body.name);
    if (!name) throw new ApiError(400, "Name is required.");
    payload.name = name;
  }
  if (pick("content")) {
    const content = fields.text(body.content);
    if (!content) throw new ApiError(400, "Testimonial text is required.");
    payload.content = content;
  }
  if (pick("role")) payload.role = fields.raw(body.role, "Student");
  if (pick("photo_url")) payload.photo_url = body.photo_url ? String(body.photo_url) : null;
  if (pick("rating")) {
    const rating = Math.min(5, Math.max(1, fields.int(body.rating, 5)));
    payload.rating = rating;
  }
  if (pick("course")) payload.course = fields.raw(body.course);
  if (pick("year")) payload.year = fields.raw(body.year);
  if (pick("featured")) payload.featured = fields.bool(body.featured, false);
  if (pick("is_active")) payload.is_active = fields.bool(body.is_active, true);
  if (pick("display_order")) payload.display_order = fields.int(body.display_order, 0);

  return payload;
}

export const testimonialResource: CrudConfig = {
  table: "testimonials",
  permissions: {
    view: PERMISSIONS.TESTIMONIALS_VIEW,
    create: PERMISSIONS.TESTIMONIALS_CREATE,
    edit: PERMISSIONS.TESTIMONIALS_EDIT,
    delete: PERMISSIONS.TESTIMONIALS_DELETE,
  },
  resourceType: "Testimonial",
  auditPrefix: "testimonial",
  select: SELECT,
  order: [
    { column: "display_order", ascending: true },
    { column: "created_at", ascending: false },
  ],
  searchColumns: ["name", "content", "course"],
  filters: [
    { column: "is_active", param: "active", map: (raw) => raw === "1" },
    { column: "featured", param: "featured", map: (raw) => raw === "1" },
  ],
  label: (row) => `${row.name || "Student"}${row.course ? ` (${row.course})` : ""}`,
  buildInsert: ({ body }) => readBody(body, false),
  buildUpdate: ({ body }) => readBody(body, true),
};
