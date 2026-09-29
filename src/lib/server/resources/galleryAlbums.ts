import { ApiError, fields, type CrudConfig } from "@/lib/server/crud";
import { PERMISSIONS } from "@/lib/constants/permissions";

const SELECT =
  "id, institute_id, title, description, cover_url, display_order, is_active, created_at, updated_at";

export const GALLERY_ALBUM_SELECT = SELECT;

function readBody(body: Record<string, unknown>, partial: boolean): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  const pick = (key: string) => !partial || body[key] !== undefined;

  if (pick("title")) {
    const title = fields.text(body.title);
    if (!title) throw new ApiError(400, "Album title is required.");
    payload.title = title;
  }
  if (pick("description")) payload.description = fields.raw(body.description);
  if (pick("cover_url")) payload.cover_url = body.cover_url ? String(body.cover_url) : null;
  if (pick("display_order")) payload.display_order = fields.int(body.display_order, 0);
  if (pick("is_active")) payload.is_active = fields.bool(body.is_active, true);

  return payload;
}

export const galleryAlbumResource: CrudConfig = {
  table: "gallery_albums",
  permissions: {
    view: PERMISSIONS.GALLERY_VIEW,
    create: PERMISSIONS.GALLERY_UPLOAD,
    edit: PERMISSIONS.GALLERY_UPLOAD,
    delete: PERMISSIONS.GALLERY_DELETE,
  },
  resourceType: "Gallery album",
  auditPrefix: "gallery.album",
  select: SELECT,
  order: [
    { column: "display_order", ascending: true },
    { column: "created_at", ascending: false },
  ],
  searchColumns: ["title", "description"],
  filters: [{ column: "is_active", param: "active", map: (raw) => raw === "1" }],
  label: (row) => String(row.title || "Untitled album"),
  buildInsert: ({ body }) => readBody(body, false),
  buildUpdate: ({ body }) => readBody(body, true),
};
