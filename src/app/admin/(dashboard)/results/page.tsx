import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthUser, hasPermission } from "@/lib/server/authorization";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { PageHeader } from "@/components/admin/PageHeader";
import { CrudTable } from "@/components/admin/CrudTable";
import { ResourceRowActions } from "@/components/admin/ResourceRowActions";
import { lookupOptions, type LookupOption } from "@/lib/server/lookups";

export const dynamic = "force-dynamic";

function labelFor(list: LookupOption[], id: unknown): string {
  if (!id) return "—";
  return list.find((option) => option.value === String(id))?.label || "—";
}

export default async function AdminResultsPage() {
  const user = await getAuthUser();
  if (!user) redirect("/admin/login");

  if (!hasPermission(user, PERMISSIONS.RESULTS_VIEW)) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        You do not have permission to view results.
      </div>
    );
  }

  const lookups = await lookupOptions(user);
  const canCreate = hasPermission(user, PERMISSIONS.RESULTS_CREATE);

  return (
    <div>
      <PageHeader
        title="Results"
        description="Published achievements shown on the public results page."
        action={
          canCreate ? (
            <Link
              href="/admin/results/new"
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800"
            >
              New result
            </Link>
          ) : null
        }
      />

      <CrudTable
        endpoint="/api/admin/results"
        searchPlaceholder="Search students or exams…"
        emptyMessage="No results yet."
        emptyHint="Add a topper entry to build your results wall."
        createHref={canCreate ? "/admin/results/new" : undefined}
        createLabel="New result"
        filters={[
          { name: "active", label: "Published", options: [{ value: "1", label: "Published" }, { value: "0", label: "Drafts" }] },
          { name: "featured", label: "Featured", options: [{ value: "1", label: "Featured" }] },
          { name: "course_id", label: "Course", options: lookups.course_id },
        ]}
        columns={[
          { key: "student_name", header: "Student", render: (row) => (
            <div>
              <p className="font-medium text-slate-900">{String(row.student_name || "—")}</p>
              <p className="text-xs text-slate-500">{labelFor(lookups.course_id, row.course_id)}</p>
            </div>
          ) },
          { key: "exam", header: "Exam", render: (row) => (
            <div>
              <p className="text-slate-700">{String(row.exam || "—")}</p>
              <p className="text-xs text-slate-500">{row.year ? String(row.year) : ""}</p>
            </div>
          ) },
          { key: "rank", header: "Rank / score", render: (row) => (
            <div>
              <p className="text-slate-700">{String(row.rank || "—")}</p>
              <p className="text-xs text-slate-500">
                {[row.percentile ? `${row.percentile} %ile` : "", row.score ? String(row.score) : ""]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
          ) },
        ]}
        actions={(row) => (
          <ResourceRowActions
            endpoint="/api/admin/results"
            row={row}
            label={String(row.student_name || "result")}
            editHref={canCreate ? `/admin/results/${String(row.id)}/edit` : undefined}
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
