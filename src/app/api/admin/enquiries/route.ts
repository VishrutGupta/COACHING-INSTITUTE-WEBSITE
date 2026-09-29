import { createListHandler, createCreateHandler } from "@/lib/server/crud";
import { enquiryResource } from "@/lib/server/resources/enquiries";

export const GET = createListHandler(enquiryResource);
export const POST = createCreateHandler(enquiryResource);
