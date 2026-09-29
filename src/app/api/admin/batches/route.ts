import { createListHandler, createCreateHandler } from "@/lib/server/crud";
import { batchResource } from "@/lib/server/resources/batches";

export const GET = createListHandler(batchResource);
export const POST = createCreateHandler(batchResource);
