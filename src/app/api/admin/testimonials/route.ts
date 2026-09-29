import { createListHandler, createCreateHandler } from "@/lib/server/crud";
import { testimonialResource } from "@/lib/server/resources/testimonials";

export const GET = createListHandler(testimonialResource);
export const POST = createCreateHandler(testimonialResource);
