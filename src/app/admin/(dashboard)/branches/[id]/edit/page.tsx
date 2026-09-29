import React from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getAuthUser, hasPermission } from "@/lib/server/authorization";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { PageHeader } from "@/components/admin/PageHeader";
import { CrudForm } from "@/components/admin/CrudForm";
import { BRANCH_FORM } from "@/components/admin/formConfigs";
import { lookupOptions } from "@/lib/server/lookups";

export const dynamic = "force-dynamic";

export default async function EditBranchPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) redirect("/admin/login");

  const { id } = await params;

  if (!hasPermission(user, PERMISSIONS.BRANCHES_VIEW)) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        You do not have permission to view branches.
      </div>
    );
  }

  let row: Record<string, unknown> | null = null;
  let courseIds: string[] = [];
  let facultyIds: string[] = [];

  try {
    const supabase = await createSupabaseServerClient();
    const [{ data }, { data: branchCourses }, { data: branchFaculty }] = await Promise.all([
      supabase
        .from("branches")
        .select("*")
        .eq("institute_id", user.instituteId)
        .eq("id", id)
        .maybeSingle(),
      supabase.from("branch_courses").select("course_id").eq("branch_id", id),
      supabase.from("branch_faculty").select("faculty_id").eq("branch_id", id),
    ]);
    row = data as Record<string, unknown> | null;
    courseIds = (branchCourses || []).map((item) => String(item.course_id));
    facultyIds = (branchFaculty || []).map((item) => String(item.faculty_id));
  } catch {
    row = null;
  }

  if (!row) notFound();

  const canEdit = hasPermission(user, PERMISSIONS.BRANCHES_EDIT);
  const staticOptions = await lookupOptions(user);

  return (
    <div>
      <PageHeader
        title={`Edit: ${String(row.name)}`}
        description="Course and faculty links replace the previous set on save."
        action={
          <Link
            href="/admin/branches"
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" /> Back to branches
          </Link>
        }
      />
      {!canEdit ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          You have read-only access to branches.
        </div>
      ) : (
        <CrudForm
          endpoint="/api/admin/branches"
          id={id}
          sections={BRANCH_FORM}
          backHref="/admin/branches"
          submitLabel="Save changes"
          initialValues={{ ...row, course_ids: courseIds, faculty_ids: facultyIds }}
          staticOptions={staticOptions}
          transform={(payload) => ({
            ...payload,
            course_ids: payload.course_ids || [],
            faculty_ids: payload.faculty_ids || [],
          })}
        />
      )}
    </div>
  );
}
