import { ApiError, fields, type CrudConfig } from "@/lib/server/crud";
import { PERMISSIONS } from "@/lib/constants/permissions";

const SELECT =
  "id, institute_id, title, description, image_url, category, album_id, display_order, is_active, created_at, updated_at";

export const GALLERY_ITEM_SELECT = SELECT;

function readBody(body: Record<string, unknown>, partial: boolean): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  const pick = (key: string) => !partial || body[key] !== undefined;

  if (pick("image_url")) {
    const url = fields.text(body.image_url);
    if (!url) throw new ApiError(400, "Upload an image first.");
    payload.image_url = url;
  }
  if (pick("title")) payload.title = fields.raw(body.title);
  if (pick("description")) payload.description = fields.raw(body.description);
  if (pick("category")) payload.category = fields.raw(body.category);
  if (pick("album_id")) payload.album_id = body.album_id ? String(body.album_id) : null;
  if (pick("display_order")) payload.display_order = fields.int(body.display_order, 0);
  if (pick("is_active")) payload.is_active = fields.bool(body.is_active, true);

  return payload;
}

export const galleryItemResource: CrudConfig = {
  table: "gallery_items",
  permissions: {
    view: PERMISSIONS.GALLERY_VIEW,
    create: PERMISSIONS.GALLERY_UPLOAD,
    edit: PERMISSIONS.GALLERY_UPLOAD,
    delete: PERMISSIONS.GALLERY_DELETE,
  },
  resourceType: "Gallery item",
  auditPrefix: "gallery",
  select: SELECT,
  order: [
    { column: "display_order", ascending: true },
    { column: "created_at", ascending: false },
  ],
  searchColumns: ["title", "category"],
  filters: [
    { column: "is_active", param: "active", map: (raw) => raw === "1" },
    { column: "album_id", param: "album_id" },
    { column: "category", param: "category" },
  ],
  label: (row) => String(row.title || row.category || "Image"),
  buildInsert: ({ body }) => readBody(body, false),
  buildUpdate: ({ body }) => readBody(body, true),
};
