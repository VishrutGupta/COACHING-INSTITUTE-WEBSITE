import { ApiError, fields, type CrudConfig } from "@/lib/server/crud";
import { PERMISSIONS } from "@/lib/constants/permissions";

const SELECT = "id, institute_id, question, answer, display_order, is_active, created_at, updated_at";

export const FAQ_SELECT = SELECT;

function readBody(body: Record<string, unknown>, partial: boolean): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  const pick = (key: string) => !partial || body[key] !== undefined;

  if (pick("question")) {
    const question = fields.text(body.question);
    if (!question) throw new ApiError(400, "Question is required.");
    payload.question = question;
  }
  if (pick("answer")) {
    const answer = fields.text(body.answer);
    if (!answer) throw new ApiError(400, "Answer is required.");
    payload.answer = answer;
  }
  if (pick("display_order")) payload.display_order = fields.int(body.display_order, 0);
  if (pick("is_active")) payload.is_active = fields.bool(body.is_active, true);

  return payload;
}

export const faqResource: CrudConfig = {
  table: "faqs",
  permissions: {
    view: PERMISSIONS.FAQ_VIEW,
    create: PERMISSIONS.FAQ_CREATE,
    edit: PERMISSIONS.FAQ_EDIT,
    delete: PERMISSIONS.FAQ_DELETE,
  },
  resourceType: "FAQ",
  auditPrefix: "faq",
  select: SELECT,
  order: [
    { column: "display_order", ascending: true },
    { column: "created_at", ascending: false },
  ],
  searchColumns: ["question", "answer"],
  filters: [{ column: "is_active", param: "active", map: (raw) => raw === "1" }],
  label: (row) => String(row.question || "Untitled question"),
  buildInsert: ({ body }) => readBody(body, false),
  buildUpdate: ({ body }) => readBody(body, true),
};
