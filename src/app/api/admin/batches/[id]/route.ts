import { createUpdateHandler, createDeleteHandler } from "@/lib/server/crud";
import { batchResource } from "@/lib/server/resources/batches";

export const PATCH = createUpdateHandler(batchResource);
export const DELETE = createDeleteHandler(batchResource);
