import { ApiError, fields, type AnySupabase, type CrudConfig } from "@/lib/server/crud";
import type { AuthUser } from "@/lib/server/authorization";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { normalizeDay, normalizeTime, timeOverlaps } from "@/lib/utils/time";

const SELECT =
  "id, institute_id, course_id, batch_id, subject_id, faculty_id, branch_id, day, date, start_time, end_time, room, mode, notes, is_active, display_order, created_at, updated_at";

export const SCHEDULE_SELECT = SELECT;

const MODES = ["Online", "Offline", "Hybrid"] as const;

const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/** The weekday an entry lands on: a concrete date wins over the recurring day. */
export function slotKey(date: string | null | undefined, day: string | null | undefined): string {
  if (date) {
    const parsed = new Date(`${String(date).slice(0, 10)}T00:00:00Z`);
    if (!Number.isNaN(parsed.getTime())) return WEEKDAY_NAMES[parsed.getUTCDay()];
  }
  return normalizeDay(String(day || ""));
}

interface ConflictCandidate {
  id: string;
  faculty_id: string | null;
  room: string;
  day: string;
  date: string | null;
  start_time: string;
  end_time: string;
}

/**
 * Blocks overlapping classes for the same faculty and the same room.
 * Never overwrites an existing entry — the request fails with a clear reason.
 */
async function assertNoConflict(
  supabase: AnySupabase,
  user: AuthUser,
  entry: {
    id?: string;
    faculty_id: string | null;
    room: string;
    day: string;
    date: string | null;
    start_time: string;
    end_time: string;
  }
) {
  if (!entry.start_time || !entry.end_time) return;
  if (entry.end_time <= entry.start_time) {
    throw new ApiError(400, "End time must be after the start time.");
  }

  const targetSlot = slotKey(entry.date, entry.day);
  if (!targetSlot) return;

  const { data, error } = await supabase
    .from("schedule_entries")
    .select("id, faculty_id, room, day, date, start_time, end_time")
    .eq("institute_id", user.instituteId)
    .lt("start_time", entry.end_time)
    .gt("end_time", entry.start_time);

  if (error) throw new ApiError(500, error.message);

  const candidates = (data || []) as unknown as ConflictCandidate[];
  const room = (entry.room || "").trim().toLowerCase();

  for (const candidate of candidates) {
    if (entry.id && candidate.id === entry.id) continue;
    if (slotKey(candidate.date, candidate.day) !== targetSlot) continue;
    if (
      !timeOverlaps(
        entry.start_time,
        entry.end_time,
        candidate.start_time,
        candidate.end_time
      )
    ) {
      continue;
    }

    const sameFaculty =
      entry.faculty_id && candidate.faculty_id && entry.faculty_id === candidate.faculty_id;
    if (sameFaculty) {
      throw new ApiError(
        409,
        "Faculty is already assigned to another class during this time."
      );
    }

    const candidateRoom = (candidate.room || "").trim().toLowerCase();
    if (room && candidateRoom && room === candidateRoom) {
      throw new ApiError(409, "Room is already assigned to another class during this time.");
    }
  }
}

function readBody(body: Record<string, unknown>, partial: boolean): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  const pick = (key: string) => !partial || body[key] !== undefined;

  if (pick("day")) payload.day = normalizeDay(fields.raw(body.day));
  if (pick("date")) payload.date = fields.nullableDate(body.date);
  if (pick("start_time")) payload.start_time = normalizeTime(body.start_time);
  if (pick("end_time")) payload.end_time = normalizeTime(body.end_time);
  if (pick("course_id")) payload.course_id = body.course_id ? String(body.course_id) : null;
  if (pick("batch_id")) payload.batch_id = body.batch_id ? String(body.batch_id) : null;
  if (pick("subject_id")) payload.subject_id = body.subject_id ? String(body.subject_id) : null;
  if (pick("faculty_id")) payload.faculty_id = body.faculty_id ? String(body.faculty_id) : null;
  if (pick("branch_id")) payload.branch_id = body.branch_id ? String(body.branch_id) : null;
  if (pick("room")) payload.room = fields.raw(body.room);
  if (pick("mode")) payload.mode = fields.oneOf(body.mode, [...MODES], "Offline");
  if (pick("notes")) payload.notes = fields.raw(body.notes);
  if (pick("is_active")) payload.is_active = fields.bool(body.is_active, true);
  if (pick("display_order")) payload.display_order = fields.int(body.display_order, 0);

  if ("start_time" in payload && "end_time" in payload) {
    const start = String(payload.start_time || "");
    const end = String(payload.end_time || "");
    if (!start || !end) throw new ApiError(400, "Start time and end time are required.");
    if (end <= start) throw new ApiError(400, "End time must be after the start time.");
  }

  return payload;
}

export const scheduleResource: CrudConfig = {
  table: "schedule_entries",
  permissions: {
    view: PERMISSIONS.SCHEDULE_VIEW,
    create: PERMISSIONS.SCHEDULE_CREATE,
    edit: PERMISSIONS.SCHEDULE_EDIT,
    delete: PERMISSIONS.SCHEDULE_DELETE,
  },
  resourceType: "Schedule",
  auditPrefix: "schedule",
  select: SELECT,
  order: [
    { column: "display_order", ascending: true },
    { column: "start_time", ascending: true },
  ],
  searchColumns: ["room", "notes"],
  filters: [
    { column: "is_active", param: "active", map: (raw) => raw === "1" },
    { column: "course_id", param: "course_id" },
    { column: "batch_id", param: "batch_id" },
    { column: "faculty_id", param: "faculty_id" },
    { column: "branch_id", param: "branch_id" },
    { column: "day", param: "day" },
  ],
  label: (row) => {
    const time = row.start_time && row.end_time ? `${row.start_time}-${row.end_time}` : "class";
    const day = row.day || (row.date ? String(row.date) : "");
    return day ? `${day} ${time}` : String(time);
  },
  buildInsert: async ({ supabase, user, body }) => {
    const payload = readBody(body, false);
    await assertNoConflict(supabase, user, {
      faculty_id: (payload.faculty_id as string | null) || null,
      room: String(payload.room || ""),
      day: String(payload.day || ""),
      date: (payload.date as string | null) || null,
      start_time: String(payload.start_time || ""),
      end_time: String(payload.end_time || ""),
    });
    return payload;
  },
  buildUpdate: async ({ supabase, user, body, before }) => {
    const payload = readBody(body, true);
    const merged = { ...(before || {}), ...payload };
    await assertNoConflict(supabase, user, {
      id: before ? String(before.id) : undefined,
      faculty_id: (merged.faculty_id as string | null) || null,
      room: String(merged.room || ""),
      day: String(merged.day || ""),
      date: (merged.date as string | null) || null,
      start_time: String(merged.start_time || ""),
      end_time: String(merged.end_time || ""),
    });
    return payload;
  },
};
