import { createUpdateHandler, createDeleteHandler } from "@/lib/server/crud";
import { branchResource } from "@/lib/server/resources/branches";

export const PATCH = createUpdateHandler(branchResource);
export const DELETE = createDeleteHandler(branchResource);
