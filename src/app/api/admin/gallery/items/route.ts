import { createListHandler, createCreateHandler } from "@/lib/server/crud";
import { galleryItemResource } from "@/lib/server/resources/galleryItems";

export const GET = createListHandler(galleryItemResource);
export const POST = createCreateHandler(galleryItemResource);
