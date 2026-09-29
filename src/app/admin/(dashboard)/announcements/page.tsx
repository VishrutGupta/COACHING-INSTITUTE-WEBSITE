import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthUser, hasPermission } from "@/lib/server/authorization";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { PageHeader } from "@/components/admin/PageHeader";
import { CrudTable } from "@/components/admin/CrudTable";
import { ResourceRowActions } from "@/components/admin/ResourceRowActions";
import { ANNOUNCEMENT_CATEGORIES } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminAnnouncementsPage() {
  const user = await getAuthUser();
  if (!user) redirect("/admin/login");

  if (!hasPermission(user, PERMISSIONS.ANNOUNCEMENTS_VIEW)) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        You do not have permission to view announcements.
      </div>
    );
  }

  const canCreate = hasPermission(user, PERMISSIONS.ANNOUNCEMENTS_CREATE);

  return (
    <div>
      <PageHeader
        title="Announcements"
        description="Notices shown on the public announcements page and homepage."
        action={
          canCreate ? (
            <Link
              href="/admin/announcements/new"
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800"
            >
              New announcement
            </Link>
          ) : null
        }
      />

      <CrudTable
        endpoint="/api/admin/announcements"
        searchPlaceholder="Search announcements…"
        emptyMessage="No announcements yet."
        createHref={canCreate ? "/admin/announcements/new" : undefined}
        createLabel="New announcement"
        filters={[
          { name: "category", label: "Category", options: ANNOUNCEMENT_CATEGORIES.map((item) => ({ value: item.value, label: item.label })) },
          { name: "active", label: "Published", options: [{ value: "1", label: "Published" }, { value: "0", label: "Drafts" }] },
        ]}
        columns={[
          { key: "title", header: "Announcement", render: (row) => (
            <div>
              <p className="font-medium text-slate-900">{String(row.title || "Untitled")}</p>
              <p className="line-clamp-1 text-xs text-slate-500">{String(row.content || "")}</p>
            </div>
          ) },
          { key: "category", header: "Category", render: (row) => {
            const category = ANNOUNCEMENT_CATEGORIES.find((item) => item.value === String(row.category));
            return (
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                {category?.label || String(row.category || "")}
              </span>
            );
          } },
          { key: "publish_date", header: "Dates", render: (row) => (
            <div className="text-xs text-slate-600">
              <p>{row.publish_date ? `From ${new Date(String(row.publish_date)).toLocaleDateString()}` : "Immediate"}</p>
              <p className="text-slate-400">
                {row.expiry_date ? `Until ${new Date(String(row.expiry_date)).toLocaleDateString()}` : "No expiry"}
              </p>
            </div>
          ) },
        ]}
        actions={(row) => (
          <ResourceRowActions
            endpoint="/api/admin/announcements"
            row={row}
            label={String(row.title || "announcement")}
            editHref={canCreate ? `/admin/announcements/${String(row.id)}/edit` : undefined}
            toggles={[
              { key: "is_active", activeLabel: "Published", inactiveLabel: "Draft" },
              { key: "featured", activeLabel: "Pinned", inactiveLabel: "Unpinned", tone: "highlight" },
            ]}
          />
        )}
      />
    </div>
  );
}
