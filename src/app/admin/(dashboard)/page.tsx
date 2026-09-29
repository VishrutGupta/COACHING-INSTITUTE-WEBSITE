import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  BookOpen,
  Boxes,
  CalendarDays,
  GraduationCap,
  Inbox,
  Layers,
  Megaphone,
  PlusCircle,
  Settings,
  Trophy,
  Users,
} from "lucide-react";
import { getAuthUser, hasPermission } from "@/lib/server/authorization";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { formatDateTime } from "@/lib/utils/format";
import { EMPTY_DASHBOARD_COUNTS, loadDashboard } from "@/lib/server/dashboard";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const user = await getAuthUser();
  if (!user) redirect("/admin/login");

  const { counts, recent, error: loadError } = await loadDashboard(user);
  const stats = counts || EMPTY_DASHBOARD_COUNTS;

  const statCards = [
    { label: "Active Courses", value: stats.activeCourses, icon: BookOpen, permission: PERMISSIONS.COURSES_VIEW },
    { label: "Faculty", value: stats.faculty, icon: GraduationCap, permission: PERMISSIONS.FACULTY_VIEW },
    { label: "Subjects", value: stats.subjects, icon: Layers, permission: PERMISSIONS.SUBJECTS_VIEW },
    { label: "Published Batches", value: stats.activeBatches, icon: Boxes, permission: PERMISSIONS.BATCHES_VIEW },
    { label: "Timetable Classes", value: stats.classes, icon: CalendarDays, permission: PERMISSIONS.SCHEDULE_VIEW },
    { label: "New Enquiries", value: stats.newEnquiries, icon: Inbox, permission: PERMISSIONS.ENQUIRIES_VIEW },
    { label: "Announcements", value: stats.announcements, icon: Megaphone, permission: PERMISSIONS.ANNOUNCEMENTS_VIEW },
    { label: "Published Results", value: stats.results, icon: Trophy, permission: PERMISSIONS.RESULTS_VIEW },
  ].filter((stat) => user.role === "owner" || hasPermission(user, stat.permission));

  const quickActions = [
    { label: "New Batch", href: "/admin/batches/new", permission: PERMISSIONS.BATCHES_CREATE, icon: PlusCircle },
    { label: "Schedule a Class", href: "/admin/schedule/new", permission: PERMISSIONS.SCHEDULE_CREATE, icon: PlusCircle },
    { label: "New Announcement", href: "/admin/announcements/new", permission: PERMISSIONS.ANNOUNCEMENTS_CREATE, icon: PlusCircle },
    { label: "Add Course", href: "/admin/courses/new", permission: PERMISSIONS.COURSES_CREATE, icon: PlusCircle },
    { label: "Add Faculty", href: "/admin/faculty/new", permission: PERMISSIONS.FACULTY_CREATE, icon: PlusCircle },
    { label: "Enquiries", href: "/admin/enquiries", permission: PERMISSIONS.ENQUIRIES_VIEW, icon: Inbox },
    { label: "Gallery", href: "/admin/gallery", permission: PERMISSIONS.GALLERY_VIEW, icon: PlusCircle },
    { label: "Settings", href: "/admin/settings", permission: PERMISSIONS.SETTINGS_VIEW, icon: Settings },
    { label: "Users", href: "/admin/users", permission: PERMISSIONS.USERS_VIEW, icon: Users },
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
        {statCards.map((stat) => {
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
            {recent.length === 0 ? (
              <p className="px-5 py-6 text-sm text-slate-500">
                No activity recorded yet. Actions you take will appear here.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {recent.map((row) => (
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
                key={`${action.href}-${action.label}`}
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
