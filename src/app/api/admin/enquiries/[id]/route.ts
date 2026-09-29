import { createUpdateHandler, createDeleteHandler } from "@/lib/server/crud";
import { enquiryResource } from "@/lib/server/resources/enquiries";

export const PATCH = createUpdateHandler(enquiryResource);
export const DELETE = createDeleteHandler(enquiryResource);
