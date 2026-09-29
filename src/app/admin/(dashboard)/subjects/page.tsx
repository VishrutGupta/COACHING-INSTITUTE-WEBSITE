import React from "react";
import { redirect } from "next/navigation";
import { getAuthUser, hasPermission } from "@/lib/server/authorization";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { PageHeader } from "@/components/admin/PageHeader";
import {
  SubjectsManager,
  type SubjectRow,
} from "@/components/admin/SubjectsManager";

export const dynamic = "force-dynamic";

export default async function AdminSubjectsPage() {
  const user = await getAuthUser();
  if (!user) redirect("/admin/login");

  if (!hasPermission(user, PERMISSIONS.SUBJECTS_VIEW)) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        You do not have permission to view subjects.
      </div>
    );
  }

  let rows: SubjectRow[] = [];
  let errorMessage = "";

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("subjects")
      .select("id, name, slug, description, display_order, is_active")
      .eq("institute_id", user.instituteId)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) errorMessage = error.message;
    else rows = (data as SubjectRow[]) || [];
  } catch {
    errorMessage = "Unable to load subjects.";
  }

  const isOwner = user.role === "owner";

  return (
    <div>
      <PageHeader
        title="Subjects"
        description="Subjects taught at the institute, used across courses and faculty."
      />

      {errorMessage && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      <SubjectsManager
        rows={rows}
        canCreate={isOwner || hasPermission(user, PERMISSIONS.SUBJECTS_CREATE)}
        canEdit={isOwner || hasPermission(user, PERMISSIONS.SUBJECTS_EDIT)}
        canDelete={isOwner || hasPermission(user, PERMISSIONS.SUBJECTS_DELETE)}
      />
    </div>
  );
}
