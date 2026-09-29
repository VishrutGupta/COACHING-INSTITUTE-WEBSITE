import { createUpdateHandler, createDeleteHandler } from "@/lib/server/crud";
import { galleryItemResource } from "@/lib/server/resources/galleryItems";

export const PATCH = createUpdateHandler(galleryItemResource);
export const DELETE = createDeleteHandler(galleryItemResource);
