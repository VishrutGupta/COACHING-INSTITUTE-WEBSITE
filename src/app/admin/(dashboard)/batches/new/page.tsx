import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getAuthUser, hasPermission } from "@/lib/server/authorization";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { PageHeader } from "@/components/admin/PageHeader";
import { CrudForm } from "@/components/admin/CrudForm";
import { BATCH_FORM } from "@/components/admin/formConfigs";
import { lookupOptions } from "@/lib/server/lookups";

export const dynamic = "force-dynamic";

export default async function NewBatchPage() {
  const user = await getAuthUser();
  if (!user) redirect("/admin/login");

  if (!hasPermission(user, PERMISSIONS.BATCHES_CREATE)) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        You do not have permission to create batches.
      </div>
    );
  }

  const staticOptions = await lookupOptions(user);

  return (
    <div>
      <PageHeader
        title="New batch"
        description="One batch = one timetable group of students."
        action={
          <Link
            href="/admin/batches"
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" /> Back to batches
          </Link>
        }
      />
      <CrudForm
        endpoint="/api/admin/batches"
        sections={BATCH_FORM}
        backHref="/admin/batches"
        submitLabel="Create batch"
        staticOptions={staticOptions}
      />
    </div>
  );
}
