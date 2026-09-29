import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getAuthUser, hasPermission } from "@/lib/server/authorization";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { PageHeader } from "@/components/admin/PageHeader";
import { FacultyForm } from "@/components/admin/FacultyForm";

export const dynamic = "force-dynamic";

export default async function NewFacultyPage() {
  const user = await getAuthUser();
  if (!user) redirect("/admin/login");

  if (!hasPermission(user, PERMISSIONS.FACULTY_CREATE)) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        You do not have permission to add faculty.
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Add faculty"
        description="Create a faculty profile for the public website."
        action={
          <Link
            href="/admin/faculty"
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" /> Back to faculty
          </Link>
        }
      />
      <FacultyForm />
    </div>
  );
}
