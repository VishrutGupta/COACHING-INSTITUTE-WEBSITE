import React from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getAuthUser, hasPermission } from "@/lib/server/authorization";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { PageHeader } from "@/components/admin/PageHeader";
import { CourseForm, type CourseFormValues } from "@/components/admin/CourseForm";

export const dynamic = "force-dynamic";

function toFormValues(row: Record<string, unknown>): CourseFormValues {
  const toArray = (value: unknown): string[] => (Array.isArray(value) ? value.map(String) : []);
  return {
    id: String(row.id),
    title: String(row.title || ""),
    short_description: String(row.short_description || ""),
    description: String(row.description || ""),
    category: String(row.category || ""),
    exam: String(row.exam || ""),
    target_audience: String(row.target_audience || ""),
    duration: String(row.duration || ""),
    fee: String(row.fee ?? ""),
    original_price: row.original_price === null || row.original_price === undefined ? "" : String(row.original_price),
    discount: String(row.discount || ""),
    mode: String(row.mode || "Offline"),
    start_date: row.start_date ? String(row.start_date).slice(0, 10) : "",
    end_date: row.end_date ? String(row.end_date).slice(0, 10) : "",
    eligibility: String(row.eligibility || ""),
    highlights: toArray(row.highlights).join("\n"),
    syllabus: toArray(row.syllabus).join("\n"),
    cover_image_url: String(row.cover_image_url || ""),
    gallery_urls: toArray(row.gallery_urls),
    brochure_url: String(row.brochure_url || ""),
    featured: Boolean(row.featured),
    is_active: Boolean(row.is_active),
    display_order: String(row.display_order ?? 0),
    whatsapp_number: String(row.whatsapp_number || ""),
    seo_title: String(row.seo_title || ""),
    seo_description: String(row.seo_description || ""),
  };
}

export default async function EditCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getAuthUser();
  if (!user) redirect("/admin/login");

  const { id } = await params;

  if (!hasPermission(user, PERMISSIONS.COURSES_VIEW)) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        You do not have permission to view courses.
      </div>
    );
  }

  let course: Record<string, unknown> | null = null;
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("courses")
      .select("*")
      .eq("institute_id", user.instituteId)
      .eq("id", id)
      .maybeSingle();
    course = data;
  } catch {
    course = null;
  }

  if (!course) notFound();

  const canEdit = user.role === "owner" || hasPermission(user, PERMISSIONS.COURSES_EDIT);

  return (
    <div>
      <PageHeader
        title={`Edit: ${String(course.title)}`}
        description="Changes are recorded in the audit log."
        action={
          <Link
            href="/admin/courses"
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" /> Back to courses
          </Link>
        }
      />

      {!canEdit ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          You have read-only access to courses.
        </div>
      ) : (
        <CourseForm initialValues={toFormValues(course)} courseId={id} />
      )}
    </div>
  );
}
