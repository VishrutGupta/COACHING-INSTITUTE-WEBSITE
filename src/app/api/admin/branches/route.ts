import { createListHandler, createCreateHandler } from "@/lib/server/crud";
import { branchResource } from "@/lib/server/resources/branches";

export const GET = createListHandler(branchResource);
export const POST = createCreateHandler(branchResource);
