import { createUpdateHandler, createDeleteHandler } from "@/lib/server/crud";
import { resultResource } from "@/lib/server/resources/results";

export const PATCH = createUpdateHandler(resultResource);
export const DELETE = createDeleteHandler(resultResource);
