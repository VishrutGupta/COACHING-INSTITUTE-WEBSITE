import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthUser, hasPermission } from "@/lib/server/authorization";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { PageHeader } from "@/components/admin/PageHeader";
import { CrudTable } from "@/components/admin/CrudTable";
import { ResourceRowActions } from "@/components/admin/ResourceRowActions";
import { lookupOptions, type LookupOption } from "@/lib/server/lookups";
import { formatTime, WEEKDAYS } from "@/lib/utils/time";

export const dynamic = "force-dynamic";

function labelFor(list: LookupOption[], id: unknown): string {
  if (!id) return "—";
  return list.find((option) => option.value === String(id))?.label || "—";
}

export default async function AdminSchedulePage() {
  const user = await getAuthUser();
  if (!user) redirect("/admin/login");

  if (!hasPermission(user, PERMISSIONS.SCHEDULE_VIEW)) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        You do not have permission to view the schedule.
      </div>
    );
  }

  const lookups = await lookupOptions(user);
  const canCreate = hasPermission(user, PERMISSIONS.SCHEDULE_CREATE);

  return (
    <div>
      <PageHeader
        title="Schedule"
        description="Weekly timetable. Faculty and room clashes are blocked server-side."
        action={
          canCreate ? (
            <Link
              href="/admin/schedule/new"
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800"
            >
              New class
            </Link>
          ) : null
        }
      />

      <CrudTable
        endpoint="/api/admin/schedule"
        searchPlaceholder="Search rooms or notes…"
        emptyMessage="No classes scheduled yet."
        emptyHint="Add classes to build the timetable."
        createHref={canCreate ? "/admin/schedule/new" : undefined}
        createLabel="New class"
        filters={[
          { name: "day", label: "Day", options: WEEKDAYS.map((day) => ({ value: day, label: day })) },
          { name: "course_id", label: "Course", options: lookups.course_id },
          { name: "faculty_id", label: "Faculty", options: lookups.faculty_id },
          { name: "active", label: "Published", options: [{ value: "1", label: "Published" }, { value: "0", label: "Drafts" }] },
        ]}
        columns={[
          { key: "day", header: "When", render: (row) => (
            <div>
              <p className="font-medium text-slate-900">
                {row.date ? new Date(String(row.date)).toLocaleDateString() : String(row.day || "—")}
              </p>
              <p className="text-xs text-slate-500">
                {row.start_time && row.end_time
                  ? `${formatTime(String(row.start_time))} – ${formatTime(String(row.end_time))}`
                  : "No time set"}
              </p>
            </div>
          ) },
          { key: "course_id", header: "Class", render: (row) => (
            <div>
              <p className="text-slate-700">
                {labelFor(lookups.course_id, row.course_id) !== "—"
                  ? labelFor(lookups.course_id, row.course_id)
                  : labelFor(lookups.batch_id, row.batch_id)}
              </p>
              <p className="text-xs text-slate-500">
                {[labelFor(lookups.subject_id, row.subject_id), labelFor(lookups.batch_id, row.batch_id)]
                  .filter((item) => item !== "—")
                  .join(" · ") || "Unassigned"}
              </p>
            </div>
          ) },
          { key: "faculty_id", header: "Faculty", render: (row) => labelFor(lookups.faculty_id, row.faculty_id) },
          { key: "room", header: "Room / mode", render: (row) => (
            <div>
              <p className="text-slate-700">{String(row.room || "—")}</p>
              <p className="text-xs text-slate-500">{String(row.mode || "")}</p>
            </div>
          ) },
          { key: "branch_id", header: "Branch", render: (row) => labelFor(lookups.branch_id, row.branch_id) },
        ]}
        actions={(row) => (
          <ResourceRowActions
            endpoint="/api/admin/schedule"
            row={row}
            label={`${row.day || row.date || "class"} ${row.start_time || ""}`}
            editHref={canCreate ? `/admin/schedule/${String(row.id)}/edit` : undefined}
            toggles={[{ key: "is_active", activeLabel: "Published", inactiveLabel: "Draft" }]}
          />
        )}
      />
    </div>
  );
}
