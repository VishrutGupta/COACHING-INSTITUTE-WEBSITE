import { createUpdateHandler, createDeleteHandler } from "@/lib/server/crud";
import { announcementResource } from "@/lib/server/resources/announcements";

export const PATCH = createUpdateHandler(announcementResource);
export const DELETE = createDeleteHandler(announcementResource);
