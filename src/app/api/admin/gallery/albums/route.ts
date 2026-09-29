import { createListHandler, createCreateHandler } from "@/lib/server/crud";
import { galleryAlbumResource } from "@/lib/server/resources/galleryAlbums";

export const GET = createListHandler(galleryAlbumResource);
export const POST = createCreateHandler(galleryAlbumResource);
