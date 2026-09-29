import { createUpdateHandler, createDeleteHandler } from "@/lib/server/crud";
import { scheduleResource } from "@/lib/server/resources/schedule";

export const PATCH = createUpdateHandler(scheduleResource);
export const DELETE = createDeleteHandler(scheduleResource);
