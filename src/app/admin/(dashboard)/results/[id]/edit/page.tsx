import React from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getAuthUser, hasPermission } from "@/lib/server/authorization";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { PageHeader } from "@/components/admin/PageHeader";
import { CrudForm } from "@/components/admin/CrudForm";
import { RESULT_FORM } from "@/components/admin/formConfigs";
import { lookupOptions } from "@/lib/server/lookups";

export const dynamic = "force-dynamic";

export default async function EditResultPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) redirect("/admin/login");

  const { id } = await params;

  if (!hasPermission(user, PERMISSIONS.RESULTS_VIEW)) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        You do not have permission to view results.
      </div>
    );
  }

  let row: Record<string, unknown> | null = null;
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("results")
      .select("*")
      .eq("institute_id", user.instituteId)
      .eq("id", id)
      .maybeSingle();
    row = data as Record<string, unknown> | null;
  } catch {
    row = null;
  }

  if (!row) notFound();

  const canEdit = hasPermission(user, PERMISSIONS.RESULTS_EDIT);
  const staticOptions = await lookupOptions(user);

  return (
    <div>
      <PageHeader
        title={`Edit: ${String(row.student_name)}`}
        description="Changes are recorded in the audit log."
        action={
          <Link
            href="/admin/results"
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" /> Back to results
          </Link>
        }
      />
      {!canEdit ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          You have read-only access to results.
        </div>
      ) : (
        <CrudForm
          endpoint="/api/admin/results"
          id={id}
          sections={RESULT_FORM}
          backHref="/admin/results"
          submitLabel="Save changes"
          initialValues={row}
          staticOptions={staticOptions}
        />
      )}
    </div>
  );
}
