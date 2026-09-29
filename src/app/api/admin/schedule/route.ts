import { createListHandler, createCreateHandler } from "@/lib/server/crud";
import { scheduleResource } from "@/lib/server/resources/schedule";

export const GET = createListHandler(scheduleResource);
export const POST = createCreateHandler(scheduleResource);
