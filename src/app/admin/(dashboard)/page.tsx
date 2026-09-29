import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpen, GraduationCap, Layers, PlusCircle, Settings, Users } from "lucide-react";
import { getAuthUser, hasPermission } from "@/lib/server/authorization";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { formatDateTime } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

const EMPTY_COUNTS = {
  courses: 0,
  activeCourses: 0,
  faculty: 0,
  activeFaculty: 0,
  subjects: 0,
};

interface ActivityRow {
  id: string;
  action: string;
  resource_type: string;
  description: string;
  actor_username: string;
  created_at: string;
}

export default async function AdminDashboardPage() {
  const user = await getAuthUser();
  if (!user) redirect("/admin/login");

  let counts = EMPTY_COUNTS;
  let recentActivity: ActivityRow[] = [];
  let loadError = false;

  if (hasPermission(user, PERMISSIONS.DASHBOARD_VIEW)) {
    try {
      const supabase = await createSupabaseServerClient();
      const [courses, activeCourses, faculty, activeFaculty, subjects, recent] =
        await Promise.all([
          supabase
            .from("courses")
            .select("id", { count: "exact", head: true })
            .eq("institute_id", user.instituteId),
          supabase
            .from("courses")
            .select("id", { count: "exact", head: true })
            .eq("institute_id", user.instituteId)
            .eq("is_active", true),
          supabase
            .from("faculty")
            .select("id", { count: "exact", head: true })
            .eq("institute_id", user.instituteId),
          supabase
            .from("faculty")
            .select("id", { count: "exact", head: true })
            .eq("institute_id", user.instituteId)
            .eq("is_active", true),
          supabase
            .from("subjects")
            .select("id", { count: "exact", head: true })
            .eq("institute_id", user.instituteId)
            .eq("is_active", true),
          supabase
            .from("audit_logs")
            .select("id, action, resource_type, description, actor_username, created_at")
            .eq("institute_id", user.instituteId)
            .order("created_at", { ascending: false })
            .limit(8),
        ]);

      counts = {
        courses: courses.count || 0,
        activeCourses: activeCourses.count || 0,
        faculty: faculty.count || 0,
        activeFaculty: activeFaculty.count || 0,
        subjects: subjects.count || 0,
      };
      recentActivity = (recent.data as ActivityRow[]) || [];
    } catch {
      loadError = true;
    }
  }

  const stats = [
    { label: "Total Courses", value: counts.courses, icon: BookOpen },
    { label: "Active Courses", value: counts.activeCourses, icon: Settings },
    { label: "Faculty", value: counts.faculty, icon: GraduationCap },
    { label: "Subjects", value: counts.subjects, icon: Layers },
  ];

  const quickActions = [
    {
      label: "Add Course",
      href: "/admin/courses/new",
      permission: PERMISSIONS.COURSES_CREATE,
      icon: PlusCircle,
    },
    {
      label: "Add Faculty",
      href: "/admin/faculty/new",
      permission: PERMISSIONS.FACULTY_CREATE,
      icon: PlusCircle,
    },
    {
      label: "Add Subject",
      href: "/admin/subjects",
      permission: PERMISSIONS.SUBJECTS_CREATE,
      icon: PlusCircle,
    },
    {
      label: "Settings",
      href: "/admin/settings",
      permission: PERMISSIONS.SETTINGS_VIEW,
      icon: Settings,
    },
    {
      label: "Users",
      href: "/admin/users",
      permission: PERMISSIONS.USERS_VIEW,
      icon: Users,
    },
  ].filter((action) => user.role === "owner" || hasPermission(user, action.permission));

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description={`Signed in as ${user.username || user.email} (${user.role})`}
      />

      {loadError && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Unable to load live data. Check that the Supabase migrations and seed SQL have been
          applied and that <code>.env.local</code> holds real credentials.
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="flex items-center gap-3 px-4 py-4 sm:px-5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs text-slate-500">{stat.label}</p>
                  <p className="text-xl font-semibold text-slate-900">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-900">Recent activity</h2>
          </div>
          <CardContent className="px-0 py-0">
            {recentActivity.length === 0 ? (
              <p className="px-5 py-6 text-sm text-slate-500">
                No activity recorded yet. Actions you take will appear here.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {recentActivity.map((row) => (
                  <li key={row.id} className="flex items-start justify-between gap-4 px-5 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm text-slate-800">{row.description}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {row.actor_username || "system"} · {row.resource_type}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-slate-400">
                      {formatDateTime(row.created_at)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-900">Quick actions</h2>
          </div>
          <CardContent className="flex flex-col gap-2">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
              >
                {action.label}
                <action.icon className="h-4 w-4 text-slate-400" />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
