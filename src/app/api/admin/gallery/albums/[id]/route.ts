import { createUpdateHandler, createDeleteHandler } from "@/lib/server/crud";
import { galleryAlbumResource } from "@/lib/server/resources/galleryAlbums";

export const PATCH = createUpdateHandler(galleryAlbumResource);
export const DELETE = createDeleteHandler(galleryAlbumResource);
