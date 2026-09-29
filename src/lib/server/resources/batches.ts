import { ApiError, fields, type CrudConfig } from "@/lib/server/crud";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { normalizeTime, normalizeDay } from "@/lib/utils/time";

const SELECT =
  "id, institute_id, name, course_id, faculty_id, branch_id, start_date, end_date, days, start_time, end_time, room, mode, capacity, status, description, is_active, display_order, created_at, updated_at";

const MODES = ["Online", "Offline", "Hybrid"] as const;
const STATUSES = ["upcoming", "ongoing", "completed", "cancelled"] as const;

export const BATCH_SELECT = SELECT;

function validateTimes(start: string, end: string) {
  const startTime = normalizeTime(start);
  const endTime = normalizeTime(end);
  if (start && !startTime) throw new ApiError(400, "Start time is not a valid time.");
  if (end && !endTime) throw new ApiError(400, "End time is not a valid time.");
  if (startTime && endTime && endTime <= startTime) {
    throw new ApiError(400, "End time must be after the start time.");
  }
  return { startTime, endTime };
}

function readBody(body: Record<string, unknown>, partial: boolean): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  const pick = (key: string) => !partial || body[key] !== undefined;

  if (pick("name")) {
    const name = fields.text(body.name);
    if (!name) throw new ApiError(400, "Batch name is required.");
    payload.name = name;
  }

  if (pick("start_time") && pick("end_time")) {
    const { startTime, endTime } = validateTimes(
      String(body.start_time ?? ""),
      String(body.end_time ?? "")
    );
    payload.start_time = startTime;
    payload.end_time = endTime;
  } else if (pick("start_time")) {
    payload.start_time = normalizeTime(String(body.start_time ?? ""));
  } else if (pick("end_time")) {
    payload.end_time = normalizeTime(String(body.end_time ?? ""));
  }

  if (pick("course_id")) payload.course_id = body.course_id ? String(body.course_id) : null;
  if (pick("faculty_id")) payload.faculty_id = body.faculty_id ? String(body.faculty_id) : null;
  if (pick("branch_id")) payload.branch_id = body.branch_id ? String(body.branch_id) : null;
  if (pick("start_date")) payload.start_date = fields.nullableDate(body.start_date);
  if (pick("end_date")) payload.end_date = fields.nullableDate(body.end_date);
  if (pick("days")) payload.days = fields.list(body.days).map(normalizeDay).filter(Boolean);
  if (pick("room")) payload.room = fields.raw(body.room);
  if (pick("mode")) payload.mode = fields.oneOf(body.mode, [...MODES], "Offline");
  if (pick("capacity")) payload.capacity = Math.max(0, fields.int(body.capacity, 0));
  if (pick("status")) payload.status = fields.oneOf(body.status, [...STATUSES], "upcoming");
  if (pick("description")) payload.description = fields.raw(body.description);
  if (pick("is_active")) payload.is_active = fields.bool(body.is_active, false);
  if (pick("display_order")) payload.display_order = fields.int(body.display_order, 0);

  return payload;
}

export const batchResource: CrudConfig = {
  table: "batches",
  permissions: {
    view: PERMISSIONS.BATCHES_VIEW,
    create: PERMISSIONS.BATCHES_CREATE,
    edit: PERMISSIONS.BATCHES_EDIT,
    delete: PERMISSIONS.BATCHES_DELETE,
  },
  resourceType: "Batch",
  auditPrefix: "batch",
  select: SELECT,
  order: [
    { column: "display_order", ascending: true },
    { column: "start_date", ascending: false },
  ],
  searchColumns: ["name", "room"],
  filters: [
    { column: "is_active", param: "active", map: (raw) => raw === "1" },
    { column: "course_id", param: "course_id" },
    { column: "branch_id", param: "branch_id" },
    { column: "status", param: "status" },
  ],
  label: (row) => String(row.name || "Untitled batch"),
  buildInsert: ({ body }) => readBody(body, false),
  buildUpdate: ({ body }) => readBody(body, true),
};
