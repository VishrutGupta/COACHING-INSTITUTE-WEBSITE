import { createListHandler, createCreateHandler } from "@/lib/server/crud";
import { resultResource } from "@/lib/server/resources/results";

export const GET = createListHandler(resultResource);
export const POST = createCreateHandler(resultResource);
