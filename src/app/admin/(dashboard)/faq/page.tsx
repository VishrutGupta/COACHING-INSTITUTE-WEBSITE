import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthUser, hasPermission } from "@/lib/server/authorization";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { PageHeader } from "@/components/admin/PageHeader";
import { CrudTable } from "@/components/admin/CrudTable";
import { ResourceRowActions } from "@/components/admin/ResourceRowActions";

export const dynamic = "force-dynamic";

export default async function AdminFaqPage() {
  const user = await getAuthUser();
  if (!user) redirect("/admin/login");

  if (!hasPermission(user, PERMISSIONS.FAQ_VIEW)) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        You do not have permission to view FAQs.
      </div>
    );
  }

  const canCreate = hasPermission(user, PERMISSIONS.FAQ_CREATE);

  return (
    <div>
      <PageHeader
        title="FAQ"
        description="Questions and answers on the public FAQ page."
        action={
          canCreate ? (
            <Link
              href="/admin/faq/new"
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800"
            >
              New question
            </Link>
          ) : null
        }
      />

      <CrudTable
        endpoint="/api/admin/faqs"
        searchPlaceholder="Search questions…"
        emptyMessage="No questions yet."
        createHref={canCreate ? "/admin/faq/new" : undefined}
        createLabel="New question"
        filters={[
          { name: "active", label: "Published", options: [{ value: "1", label: "Published" }, { value: "0", label: "Drafts" }] },
        ]}
        columns={[
          { key: "question", header: "Question", render: (row) => (
            <p className="font-medium text-slate-900">{String(row.question || "—")}</p>
          ) },
          { key: "answer", header: "Answer", render: (row) => (
            <p className="line-clamp-2 text-slate-600">{String(row.answer || "")}</p>
          ) },
          { key: "display_order", header: "Order", render: (row) => String(row.display_order ?? 0) },
        ]}
        actions={(row) => (
          <ResourceRowActions
            endpoint="/api/admin/faqs"
            row={row}
            label={String(row.question || "question")}
            editHref={canCreate ? `/admin/faq/${String(row.id)}/edit` : undefined}
            toggles={[{ key: "is_active", activeLabel: "Published", inactiveLabel: "Draft" }]}
          />
        )}
      />
    </div>
  );
}
