import React from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getAuthUser, hasPermission } from "@/lib/server/authorization";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { PageHeader } from "@/components/admin/PageHeader";
import { FacultyForm, type FacultyFormValues } from "@/components/admin/FacultyForm";

export const dynamic = "force-dynamic";

function toFormValues(row: Record<string, unknown>): FacultyFormValues {
  return {
    name: String(row.name || ""),
    designation: String(row.designation || ""),
    subject: String(row.subject || ""),
    qualification: String(row.qualification || ""),
    experience: String(row.experience || ""),
    bio: String(row.bio || ""),
    specialization: String(row.specialization || ""),
    achievements: String(row.achievements || ""),
    profile_image: String(row.profile_image || ""),
    linkedin_url: String(row.linkedin_url || ""),
    display_order: String(row.display_order ?? 0),
    is_active: Boolean(row.is_active),
    featured: Boolean(row.featured),
  };
}

export default async function EditFacultyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getAuthUser();
  if (!user) redirect("/admin/login");

  const { id } = await params;

  if (!hasPermission(user, PERMISSIONS.FACULTY_VIEW)) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        You do not have permission to view faculty.
      </div>
    );
  }

  let member: Record<string, unknown> | null = null;
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("faculty")
      .select("*")
      .eq("institute_id", user.instituteId)
      .eq("id", id)
      .maybeSingle();
    member = data;
  } catch {
    member = null;
  }

  if (!member) notFound();

  const canEdit = user.role === "owner" || hasPermission(user, PERMISSIONS.FACULTY_EDIT);

  return (
    <div>
      <PageHeader
        title={`Edit: ${String(member.name)}`}
        description="Changes are recorded in the audit log."
        action={
          <Link
            href="/admin/faculty"
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" /> Back to faculty
          </Link>
        }
      />

      {!canEdit ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          You have read-only access to faculty.
        </div>
      ) : (
        <FacultyForm initialValues={toFormValues(member)} facultyId={id} />
      )}
    </div>
  );
}
