import React from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getAuthUser, hasPermission } from "@/lib/server/authorization";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { PageHeader } from "@/components/admin/PageHeader";
import { CrudForm } from "@/components/admin/CrudForm";
import { TESTIMONIAL_FORM } from "@/components/admin/formConfigs";

export const dynamic = "force-dynamic";

export default async function EditTestimonialPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) redirect("/admin/login");

  const { id } = await params;

  if (!hasPermission(user, PERMISSIONS.TESTIMONIALS_VIEW)) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        You do not have permission to view testimonials.
      </div>
    );
  }

  let row: Record<string, unknown> | null = null;
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("testimonials")
      .select("*")
      .eq("institute_id", user.instituteId)
      .eq("id", id)
      .maybeSingle();
    row = data as Record<string, unknown> | null;
  } catch {
    row = null;
  }

  if (!row) notFound();

  const canEdit = hasPermission(user, PERMISSIONS.TESTIMONIALS_EDIT);

  return (
    <div>
      <PageHeader
        title={`Edit: ${String(row.name)}`}
        description="Changes are recorded in the audit log."
        action={
          <Link
            href="/admin/testimonials"
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" /> Back to testimonials
          </Link>
        }
      />
      {!canEdit ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          You have read-only access to testimonials.
        </div>
      ) : (
        <CrudForm
          endpoint="/api/admin/testimonials"
          id={id}
          sections={TESTIMONIAL_FORM}
          backHref="/admin/testimonials"
          submitLabel="Save changes"
          initialValues={row}
        />
      )}
    </div>
  );
}
