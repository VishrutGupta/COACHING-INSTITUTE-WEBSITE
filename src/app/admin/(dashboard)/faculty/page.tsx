import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { getAuthUser, hasPermission } from "@/lib/server/authorization";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { PageHeader } from "@/components/admin/PageHeader";
import { FacultyRowActions } from "@/components/admin/FacultyRowActions";

export const dynamic = "force-dynamic";

interface FacultyRow {
  id: string;
  name: string;
  designation: string;
  subject: string;
  qualification: string;
  featured: boolean;
  is_active: boolean;
  profile_image: string | null;
}

export default async function AdminFacultyPage() {
  const user = await getAuthUser();
  if (!user) redirect("/admin/login");

  if (!hasPermission(user, PERMISSIONS.FACULTY_VIEW)) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        You do not have permission to view faculty.
      </div>
    );
  }

  let faculty: FacultyRow[] = [];
  let errorMessage = "";

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("faculty")
      .select("id, name, designation, subject, qualification, featured, is_active, profile_image")
      .eq("institute_id", user.instituteId)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) errorMessage = error.message;
    else faculty = (data as FacultyRow[]) || [];
  } catch {
    errorMessage = "Unable to load faculty.";
  }

  const canCreate = user.role === "owner" || hasPermission(user, PERMISSIONS.FACULTY_CREATE);

  return (
    <div>
      <PageHeader
        title="Faculty"
        description={`${faculty.length} member${faculty.length === 1 ? "" : "s"}`}
        action={
          canCreate ? (
            <Link
              href="/admin/faculty/new"
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" /> Add faculty
            </Link>
          ) : null
        }
      />

      {errorMessage && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {faculty.length === 0 && !errorMessage ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <p className="text-sm text-slate-600">No faculty members yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {faculty.map((member) => (
            <div
              key={member.id}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start gap-3">
                {member.profile_image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={member.profile_image}
                    alt={member.name}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-sm font-medium text-slate-600">
                    {member.name.charAt(0).toUpperCase()}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900">{member.name}</p>
                  <p className="truncate text-xs text-slate-500">
                    {[member.designation, member.subject].filter(Boolean).join(" · ")}
                  </p>
                  <p className="truncate text-xs text-slate-400">{member.qualification}</p>
                </div>
              </div>

              <div className="mt-4">
                <FacultyRowActions
                  id={member.id}
                  name={member.name}
                  isActive={member.is_active}
                  featured={member.featured}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
