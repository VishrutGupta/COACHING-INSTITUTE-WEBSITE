import { createUpdateHandler, createDeleteHandler } from "@/lib/server/crud";
import { faqResource } from "@/lib/server/resources/faqs";

export const PATCH = createUpdateHandler(faqResource);
export const DELETE = createDeleteHandler(faqResource);
