import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getAuthUser, hasPermission } from "@/lib/server/authorization";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { PageHeader } from "@/components/admin/PageHeader";
import { CrudForm } from "@/components/admin/CrudForm";
import { BRANCH_FORM } from "@/components/admin/formConfigs";
import { lookupOptions } from "@/lib/server/lookups";

export const dynamic = "force-dynamic";

export default async function NewBranchPage() {
  const user = await getAuthUser();
  if (!user) redirect("/admin/login");

  if (!hasPermission(user, PERMISSIONS.BRANCHES_CREATE)) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        You do not have permission to create branches.
      </div>
    );
  }

  const staticOptions = await lookupOptions(user);

  return (
    <div>
      <PageHeader
        title="New branch"
        description="Choose which courses and faculty this location offers."
        action={
          <Link
            href="/admin/branches"
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" /> Back to branches
          </Link>
        }
      />
      <CrudForm
        endpoint="/api/admin/branches"
        sections={BRANCH_FORM}
        backHref="/admin/branches"
        submitLabel="Create branch"
        staticOptions={staticOptions}
        transform={(payload) => ({
          ...payload,
          course_ids: payload.course_ids || [],
          faculty_ids: payload.faculty_ids || [],
        })}
      />
    </div>
  );
}
