import { createListHandler, createCreateHandler } from "@/lib/server/crud";
import { announcementResource } from "@/lib/server/resources/announcements";

export const GET = createListHandler(announcementResource);
export const POST = createCreateHandler(announcementResource);
