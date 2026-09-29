import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { getAuthUser, hasPermission } from "@/lib/server/authorization";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { PageHeader } from "@/components/admin/PageHeader";
import { CourseRowActions } from "@/components/admin/CourseRowActions";
import { formatCurrency } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

interface CourseRow {
  id: string;
  title: string;
  slug: string;
  category: string;
  exam: string;
  fee: number;
  mode: string;
  featured: boolean;
  is_active: boolean;
  display_order: number;
}

export default async function AdminCoursesPage() {
  const user = await getAuthUser();
  if (!user) redirect("/admin/login");
  if (!hasPermission(user, PERMISSIONS.COURSES_VIEW)) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        You do not have permission to view courses.
      </div>
    );
  }

  let courses: CourseRow[] = [];
  let errorMessage = "";

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("courses")
      .select(
        "id, title, slug, category, exam, fee, mode, featured, is_active, display_order"
      )
      .eq("institute_id", user.instituteId)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) errorMessage = error.message;
    else courses = (data as CourseRow[]) || [];
  } catch {
    errorMessage = "Unable to load courses.";
  }

  const canCreate = user.role === "owner" || hasPermission(user, PERMISSIONS.COURSES_CREATE);

  return (
    <div>
      <PageHeader
        title="Courses"
        description={`${courses.length} course${courses.length === 1 ? "" : "s"} total`}
        action={
          canCreate ? (
            <Link
              href="/admin/courses/new"
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" /> New course
            </Link>
          ) : null
        }
      />

      {errorMessage && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {courses.length === 0 && !errorMessage ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <p className="text-sm text-slate-600">No courses yet.</p>
          {canCreate && (
            <Link
              href="/admin/courses/new"
              className="mt-3 inline-block text-sm font-medium text-slate-900 underline"
            >
              Create your first course
            </Link>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Course</th>
                  <th className="px-4 py-3 font-medium">Exam</th>
                  <th className="px-4 py-3 font-medium">Mode</th>
                  <th className="px-4 py-3 font-medium">Fee</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {courses.map((course) => (
                  <tr key={course.id} className="align-top">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{course.title}</p>
                      <p className="text-xs text-slate-500">
                        {course.category || "Uncategorised"}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{course.exam || "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{course.mode}</td>
                    <td className="px-4 py-3 text-slate-700">{formatCurrency(course.fee)}</td>
                    <td className="px-4 py-3">
                      <CourseRowActions
                        id={course.id}
                        title={course.title}
                        isActive={course.is_active}
                        featured={course.featured}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
