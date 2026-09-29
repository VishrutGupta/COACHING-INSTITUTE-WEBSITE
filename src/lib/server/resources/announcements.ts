import { ApiError, fields, type CrudConfig } from "@/lib/server/crud";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { ANNOUNCEMENT_CATEGORIES } from "@/lib/types";

const SELECT =
  "id, institute_id, title, content, image_url, category, publish_date, expiry_date, is_active, featured, display_order, created_at, updated_at";

export const ANNOUNCEMENT_SELECT = SELECT;

const CATEGORIES = ANNOUNCEMENT_CATEGORIES.map((item) => item.value);

function readBody(body: Record<string, unknown>, partial: boolean): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  const pick = (key: string) => !partial || body[key] !== undefined;

  if (pick("title")) {
    const title = fields.text(body.title);
    if (!title) throw new ApiError(400, "Title is required.");
    payload.title = title;
  }
  if (pick("content")) payload.content = fields.raw(body.content);
  if (pick("image_url")) payload.image_url = body.image_url ? String(body.image_url) : null;
  if (pick("category")) payload.category = fields.oneOf(body.category, CATEGORIES, "important");
  if (pick("publish_date")) payload.publish_date = fields.nullableDate(body.publish_date);
  if (pick("expiry_date")) payload.expiry_date = fields.nullableDate(body.expiry_date);
  if (pick("is_active")) payload.is_active = fields.bool(body.is_active, true);
  if (pick("featured")) payload.featured = fields.bool(body.featured, false);
  if (pick("display_order")) payload.display_order = fields.int(body.display_order, 0);

  if (
    payload.publish_date &&
    payload.expiry_date &&
    String(payload.expiry_date) < String(payload.publish_date)
  ) {
    throw new ApiError(400, "Expiry date cannot be before the publish date.");
  }

  return payload;
}

export const announcementResource: CrudConfig = {
  table: "announcements",
  permissions: {
    view: PERMISSIONS.ANNOUNCEMENTS_VIEW,
    create: PERMISSIONS.ANNOUNCEMENTS_CREATE,
    edit: PERMISSIONS.ANNOUNCEMENTS_EDIT,
    delete: PERMISSIONS.ANNOUNCEMENTS_DELETE,
  },
  resourceType: "Announcement",
  auditPrefix: "announcement",
  select: SELECT,
  order: [
    { column: "display_order", ascending: true },
    { column: "publish_date", ascending: false },
  ],
  searchColumns: ["title", "content"],
  filters: [
    { column: "is_active", param: "active", map: (raw) => raw === "1" },
    { column: "category", param: "category" },
  ],
  label: (row) => String(row.title || "Untitled"),
  buildInsert: ({ body }) => readBody(body, false),
  buildUpdate: ({ body }) => readBody(body, true),
};
