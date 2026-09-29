import { ApiError, fields, type CrudConfig } from "@/lib/server/crud";
import { PERMISSIONS } from "@/lib/constants/permissions";

const SELECT =
  "id, institute_id, student_name, exam, year, rank, percentile, score, course_id, image_url, description, featured, is_active, display_order, created_at, updated_at";

export const RESULT_SELECT = SELECT;

function readBody(body: Record<string, unknown>, partial: boolean): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  const pick = (key: string) => !partial || body[key] !== undefined;

  if (pick("student_name")) {
    const name = fields.text(body.student_name);
    if (!name) throw new ApiError(400, "Student display name is required.");
    payload.student_name = name;
  }
  if (pick("exam")) payload.exam = fields.raw(body.exam);
  if (pick("year")) {
    const year = fields.int(body.year, 0);
    payload.year = year > 1900 ? year : null;
  }
  if (pick("rank")) payload.rank = fields.raw(body.rank);
  if (pick("percentile")) payload.percentile = fields.raw(body.percentile);
  if (pick("score")) payload.score = fields.raw(body.score);
  if (pick("course_id")) payload.course_id = body.course_id ? String(body.course_id) : null;
  if (pick("image_url")) payload.image_url = body.image_url ? String(body.image_url) : null;
  if (pick("description")) payload.description = fields.raw(body.description);
  if (pick("featured")) payload.featured = fields.bool(body.featured, false);
  if (pick("is_active")) payload.is_active = fields.bool(body.is_active, true);
  if (pick("display_order")) payload.display_order = fields.int(body.display_order, 0);

  return payload;
}

export const resultResource: CrudConfig = {
  table: "results",
  permissions: {
    view: PERMISSIONS.RESULTS_VIEW,
    create: PERMISSIONS.RESULTS_CREATE,
    edit: PERMISSIONS.RESULTS_EDIT,
    delete: PERMISSIONS.RESULTS_DELETE,
  },
  resourceType: "Result",
  auditPrefix: "result",
  select: SELECT,
  order: [
    { column: "display_order", ascending: true },
    { column: "year", ascending: false },
  ],
  searchColumns: ["student_name", "exam"],
  filters: [
    { column: "is_active", param: "active", map: (raw) => raw === "1" },
    { column: "exam", param: "exam" },
    { column: "featured", param: "featured", map: (raw) => raw === "1" },
  ],
  label: (row) => `${row.student_name || "Student"}${row.exam ? ` (${row.exam})` : ""}`,
  buildInsert: ({ body }) => readBody(body, false),
  buildUpdate: ({ body }) => readBody(body, true),
};
