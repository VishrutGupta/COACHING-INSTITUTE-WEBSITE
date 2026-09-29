import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthUser, hasPermission } from "@/lib/server/authorization";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { PageHeader } from "@/components/admin/PageHeader";
import { CrudTable } from "@/components/admin/CrudTable";
import { ResourceRowActions } from "@/components/admin/ResourceRowActions";
import { lookupOptions, type LookupOption } from "@/lib/server/lookups";
import { formatTime } from "@/lib/utils/time";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  upcoming: "Upcoming",
  ongoing: "Ongoing",
  completed: "Completed",
  cancelled: "Cancelled",
};

function labelFor(list: LookupOption[], id: unknown): string {
  if (!id) return "—";
  return list.find((option) => option.value === String(id))?.label || "—";
}

export default async function AdminBatchesPage() {
  const user = await getAuthUser();
  if (!user) redirect("/admin/login");

  if (!hasPermission(user, PERMISSIONS.BATCHES_VIEW)) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        You do not have permission to view batches.
      </div>
    );
  }

  const lookups = await lookupOptions(user);
  const canCreate = hasPermission(user, PERMISSIONS.BATCHES_CREATE);

  return (
    <div>
      <PageHeader
        title="Batches"
        description="Timetables, seats and batch publishing."
        action={
          canCreate ? (
            <Link
              href="/admin/batches/new"
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800"
            >
              New batch
            </Link>
          ) : null
        }
      />

      <CrudTable
        endpoint="/api/admin/batches"
        searchPlaceholder="Search batches or rooms…"
        emptyMessage="No batches yet."
        emptyHint="Create a batch to open admissions for it."
        createHref={canCreate ? "/admin/batches/new" : undefined}
        createLabel="New batch"
        filters={[
          { name: "status", label: "Status", options: Object.entries(STATUS_LABELS).map(([value, text]) => ({ value, label: text })) },
          { name: "active", label: "Published", options: [{ value: "1", label: "Published" }, { value: "0", label: "Drafts" }] },
          { name: "course_id", label: "Course", options: lookups.course_id },
        ]}
        columns={[
          { key: "name", header: "Batch", render: (row) => (
            <div>
              <p className="font-medium text-slate-900">{String(row.name || "Untitled")}</p>
              <p className="text-xs text-slate-500">{labelFor(lookups.course_id, row.course_id)}</p>
            </div>
          ) },
          { key: "start_time", header: "Timing", render: (row) => {
            const days = Array.isArray(row.days) ? (row.days as string[]).join(", ") : "—";
            const time =
              row.start_time && row.end_time
                ? `${formatTime(String(row.start_time))} – ${formatTime(String(row.end_time))}`
                : "No time set";
            return (
              <div>
                <p className="text-slate-700">{time}</p>
                <p className="text-xs text-slate-500">{days}</p>
              </div>
            );
          } },
          { key: "room", header: "Room / mode", render: (row) => (
            <div>
              <p className="text-slate-700">{String(row.room || "—")}</p>
              <p className="text-xs text-slate-500">{String(row.mode || "")}</p>
            </div>
          ) },
          { key: "capacity", header: "Seats", render: (row) =>
            Number(row.capacity) > 0 ? String(row.capacity) : "Unlimited" },
          { key: "status", header: "Status", render: (row) => (
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
              {STATUS_LABELS[String(row.status)] || String(row.status || "")}
            </span>
          ) },
        ]}
        actions={(row) => (
          <ResourceRowActions
            endpoint="/api/admin/batches"
            row={row}
            label={String(row.name || "batch")}
            editHref={canCreate ? `/admin/batches/${String(row.id)}/edit` : undefined}
            toggles={[{ key: "is_active", activeLabel: "Published", inactiveLabel: "Draft" }]}
          />
        )}
      />
    </div>
  );
}
