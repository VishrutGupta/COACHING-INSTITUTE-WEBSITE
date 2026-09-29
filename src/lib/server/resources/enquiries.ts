import { ApiError, fields, type AnySupabase, type CrudConfig } from "@/lib/server/crud";
import type { AuthUser } from "@/lib/server/authorization";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { ENQUIRY_STATUSES } from "@/lib/types";

const SELECT =
  "id, institute_id, name, phone, email, message, course_id, source, status, preferred_batch, assigned_to, notes, created_at, updated_at, profiles:profiles(username, full_name)";

export const ENQUIRY_SELECT = SELECT;

const SOURCES = ["contact", "course", "apply", "callback"];

async function assertAssignable(
  supabase: AnySupabase,
  user: AuthUser,
  assignedTo: string
) {
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("institute_id", user.instituteId)
    .eq("id", assignedTo)
    .maybeSingle();
  if (!data) throw new ApiError(400, "Selected team member does not exist.");
}

function readBody(body: Record<string, unknown>, partial: boolean): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  const pick = (key: string) => !partial || body[key] !== undefined;

  if (pick("name")) {
    const name = fields.text(body.name);
    if (!name) throw new ApiError(400, "Name is required.");
    payload.name = name;
  }
  if (pick("phone")) payload.phone = fields.raw(body.phone);
  if (pick("email")) {
    const email = fields.text(body.email);
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new ApiError(400, "Enter a valid email address.");
    }
    payload.email = email;
  }
  if (pick("message")) payload.message = fields.raw(body.message);
  if (pick("course_id")) payload.course_id = body.course_id ? String(body.course_id) : null;
  if (pick("source")) payload.source = fields.oneOf(body.source, SOURCES, "contact");
  if (pick("status")) payload.status = fields.oneOf(body.status, ENQUIRY_STATUSES, "new");
  if (pick("preferred_batch")) payload.preferred_batch = fields.raw(body.preferred_batch);
  if (pick("notes")) payload.notes = fields.raw(body.notes);
  if (pick("assigned_to")) payload.assigned_to = body.assigned_to ? String(body.assigned_to) : null;

  return payload;
}

export const enquiryResource: CrudConfig = {
  table: "enquiries",
  permissions: {
    view: PERMISSIONS.ENQUIRIES_VIEW,
    create: PERMISSIONS.ENQUIRIES_CREATE,
    edit: PERMISSIONS.ENQUIRIES_EDIT,
    delete: PERMISSIONS.ENQUIRIES_DELETE,
  },
  resourceType: "Enquiry",
  auditPrefix: "enquiry",
  select: SELECT,
  order: [{ column: "created_at", ascending: false }],
  searchColumns: ["name", "email", "phone", "message"],
  filters: [
    { column: "status", param: "status" },
    { column: "source", param: "source" },
    { column: "assigned_to", param: "assigned_to" },
  ],
  label: (row) => `${row.name || "Someone"} (${row.status || "new"})`,
  buildInsert: async ({ supabase, user, body }) => {
    const payload = readBody(body, false);
    if (payload.assigned_to) {
      await assertAssignable(supabase, user, String(payload.assigned_to));
    }
    if (!payload.message) payload.message = "";
    return payload;
  },
  buildUpdate: async ({ supabase, user, body }) => {
    const payload = readBody(body, true);
    if (payload.assigned_to) {
      await assertAssignable(supabase, user, String(payload.assigned_to));
    }
    return payload;
  },
  augmentSnapshot: async ({ snapshot }) => {
    const output = { ...snapshot };
    delete output.profiles;
    return output;
  },
};
