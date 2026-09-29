import { createUpdateHandler, createDeleteHandler } from "@/lib/server/crud";
import { testimonialResource } from "@/lib/server/resources/testimonials";

export const PATCH = createUpdateHandler(testimonialResource);
export const DELETE = createDeleteHandler(testimonialResource);
