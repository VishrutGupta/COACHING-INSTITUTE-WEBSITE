import React from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getAuthUser, hasPermission } from "@/lib/server/authorization";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { PageHeader } from "@/components/admin/PageHeader";
import { CrudForm } from "@/components/admin/CrudForm";
import { ANNOUNCEMENT_FORM } from "@/components/admin/formConfigs";

export const dynamic = "force-dynamic";

export default async function EditAnnouncementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getAuthUser();
  if (!user) redirect("/admin/login");

  const { id } = await params;

  if (!hasPermission(user, PERMISSIONS.ANNOUNCEMENTS_VIEW)) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        You do not have permission to view announcements.
      </div>
    );
  }

  let row: Record<string, unknown> | null = null;
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("announcements")
      .select("*")
      .eq("institute_id", user.instituteId)
      .eq("id", id)
      .maybeSingle();
    row = data as Record<string, unknown> | null;
  } catch {
    row = null;
  }

  if (!row) notFound();

  const canEdit = hasPermission(user, PERMISSIONS.ANNOUNCEMENTS_EDIT);

  return (
    <div>
      <PageHeader
        title={`Edit: ${String(row.title)}`}
        description="Changes are recorded in the audit log."
        action={
          <Link
            href="/admin/announcements"
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" /> Back to announcements
          </Link>
        }
      />
      {!canEdit ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          You have read-only access to announcements.
        </div>
      ) : (
        <CrudForm
          endpoint="/api/admin/announcements"
          id={id}
          sections={ANNOUNCEMENT_FORM}
          backHref="/admin/announcements"
          submitLabel="Save changes"
          initialValues={row}
        />
      )}
    </div>
  );
}
