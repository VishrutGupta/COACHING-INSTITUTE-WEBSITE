import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthUser, hasPermission } from "@/lib/server/authorization";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { PageHeader } from "@/components/admin/PageHeader";
import { CrudTable } from "@/components/admin/CrudTable";
import { ResourceRowActions } from "@/components/admin/ResourceRowActions";

export const dynamic = "force-dynamic";

export default async function AdminBranchesPage() {
  const user = await getAuthUser();
  if (!user) redirect("/admin/login");

  if (!hasPermission(user, PERMISSIONS.BRANCHES_VIEW)) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        You do not have permission to view branches.
      </div>
    );
  }

  const canCreate = hasPermission(user, PERMISSIONS.BRANCHES_CREATE);

  return (
    <div>
      <PageHeader
        title="Branches"
        description="Locations, their courses and their faculty."
        action={
          canCreate ? (
            <Link
              href="/admin/branches/new"
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800"
            >
              New branch
            </Link>
          ) : null
        }
      />

      <CrudTable
        endpoint="/api/admin/branches"
        searchPlaceholder="Search branches or addresses…"
        emptyMessage="No branches yet."
        emptyHint="Create a branch to list locations on the public site."
        createHref={canCreate ? "/admin/branches/new" : undefined}
        createLabel="New branch"
        filters={[
          { name: "active", label: "Published", options: [{ value: "1", label: "Published" }, { value: "0", label: "Drafts" }] },
        ]}
        columns={[
          { key: "name", header: "Branch", render: (row) => (
            <div>
              <p className="font-medium text-slate-900">{String(row.name || "Untitled")}</p>
              <p className="line-clamp-1 text-xs text-slate-500">{String(row.address || "No address")}</p>
            </div>
          ) },
          { key: "phone", header: "Contact", render: (row) => (
            <div>
              <p className="text-slate-700">{String(row.phone || "—")}</p>
              <p className="text-xs text-slate-500">{String(row.email || "")}</p>
            </div>
          ) },
          { key: "opening_hours", header: "Hours", render: (row) => String(row.opening_hours || "—") },
        ]}
        actions={(row) => (
          <ResourceRowActions
            endpoint="/api/admin/branches"
            row={row}
            label={String(row.name || "branch")}
            editHref={canCreate ? `/admin/branches/${String(row.id)}/edit` : undefined}
            toggles={[{ key: "is_active", activeLabel: "Published", inactiveLabel: "Draft" }]}
          />
        )}
      />
    </div>
  );
}
