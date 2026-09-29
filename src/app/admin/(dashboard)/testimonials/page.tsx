import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthUser, hasPermission } from "@/lib/server/authorization";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { PageHeader } from "@/components/admin/PageHeader";
import { CrudTable } from "@/components/admin/CrudTable";
import { ResourceRowActions } from "@/components/admin/ResourceRowActions";

export const dynamic = "force-dynamic";

export default async function AdminTestimonialsPage() {
  const user = await getAuthUser();
  if (!user) redirect("/admin/login");

  if (!hasPermission(user, PERMISSIONS.TESTIMONIALS_VIEW)) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        You do not have permission to view testimonials.
      </div>
    );
  }

  const canCreate = hasPermission(user, PERMISSIONS.TESTIMONIALS_CREATE);

  return (
    <div>
      <PageHeader
        title="Testimonials"
        description="Student and parent reviews shown on the public site."
        action={
          canCreate ? (
            <Link
              href="/admin/testimonials/new"
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800"
            >
              New testimonial
            </Link>
          ) : null
        }
      />

      <CrudTable
        endpoint="/api/admin/testimonials"
        searchPlaceholder="Search testimonials…"
        emptyMessage="No testimonials yet."
        createHref={canCreate ? "/admin/testimonials/new" : undefined}
        createLabel="New testimonial"
        filters={[
          { name: "active", label: "Published", options: [{ value: "1", label: "Published" }, { value: "0", label: "Drafts" }] },
          { name: "featured", label: "Featured", options: [{ value: "1", label: "Featured" }] },
        ]}
        columns={[
          { key: "name", header: "Person", render: (row) => (
            <div>
              <p className="font-medium text-slate-900">{String(row.name || "—")}</p>
              <p className="text-xs text-slate-500">
                {[row.role, row.course, row.year].filter(Boolean).join(" · ")}
              </p>
            </div>
          ) },
          { key: "content", header: "Review", render: (row) => (
            <p className="line-clamp-2 text-slate-600">{String(row.content || "")}</p>
          ) },
          { key: "rating", header: "Rating", render: (row) => (
            <span className="text-amber-600">{"★".repeat(Number(row.rating) || 0)}{"☆".repeat(5 - (Number(row.rating) || 0))}</span>
          ) },
        ]}
        actions={(row) => (
          <ResourceRowActions
            endpoint="/api/admin/testimonials"
            row={row}
            label={String(row.name || "testimonial")}
            editHref={canCreate ? `/admin/testimonials/${String(row.id)}/edit` : undefined}
            toggles={[
              { key: "is_active", activeLabel: "Published", inactiveLabel: "Draft" },
              { key: "featured", activeLabel: "Featured", inactiveLabel: "Standard", tone: "highlight" },
            ]}
          />
        )}
      />
    </div>
  );
}
