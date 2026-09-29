import { createListHandler, createCreateHandler } from "@/lib/server/crud";
import { faqResource } from "@/lib/server/resources/faqs";

export const GET = createListHandler(faqResource);
export const POST = createCreateHandler(faqResource);
