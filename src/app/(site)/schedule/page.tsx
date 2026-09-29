import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, Filter, Monitor } from "lucide-react";
import { getInstitute } from "@/lib/data/settings";
import {
  getActiveBranches,
  getPublishedCourses,
  getPublishedFaculty,
  getPublicSchedule,
} from "@/lib/data/public";
import { EmptyState } from "@/components/site/Shared";
import { WEEKDAYS, dayIndex, formatTime, normalizeDay } from "@/lib/utils/time";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const institute = await getInstitute();
  return {
    title: "Class Schedule",
    description: `Weekly class schedule and timetable at ${institute.name || "our institute"}.`,
  };
}

interface ScheduleSearchParams {
  course?: string;
  faculty?: string;
  day?: string;
  branch?: string;
}

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<ScheduleSearchParams>;
}) {
  const params = await searchParams;
  const course = (params.course || "").trim();
  const faculty = (params.faculty || "").trim();
  const day = (params.day || "").trim();
  const branch = (params.branch || "").trim();

  const [courses, facultyList, branches, entries] = await Promise.all([
    getPublishedCourses(),
    getPublishedFaculty(),
    getActiveBranches(),
    getPublicSchedule({
      courseId: course || undefined,
      facultyId: faculty || undefined,
      day: day ? normalizeDay(day) : undefined,
      branchId: branch || undefined,
    }),
  ]);

  const sorted = [...entries].sort((a, b) => dayIndex(a.day) - dayIndex(b.day));

  const groups = WEEKDAYS.map((weekday) => ({
    day: weekday,
    rows: sorted.filter((entry) => normalizeDay(entry.day) === weekday),
  })).filter((group) => group.rows.length > 0);

  const hasFilter = Boolean(course || faculty || day || branch);

  return (
    <>
      <section className="border-b border-slate-200 bg-slate-50">
        <div className="container-site py-14">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--accent,#2563eb)]">
            Schedule
          </p>
          <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
            Weekly class timetable
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-600 sm:text-base">
            Classes run as per the timetable below. Changes are updated here first.
          </p>
        </div>
      </section>

      <section className="container-site py-14">
        <form
          method="get"
          className="mb-10 rounded-xl border border-slate-200 bg-white p-4 sm:p-5"
          aria-label="Filter schedule"
        >
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Filter className="h-4 w-4 text-slate-400" /> Filter classes
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-500">Day</span>
              <select
                name="day"
                defaultValue={day}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
              >
                <option value="">All days</option>
                {WEEKDAYS.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-500">Course</span>
              <select
                name="course"
                defaultValue={course}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
              >
                <option value="">All courses</option>
                {courses.map((row) => (
                  <option key={row.id} value={row.id}>
                    {row.title}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-500">Faculty</span>
              <select
                name="faculty"
                defaultValue={faculty}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
              >
                <option value="">All faculty</option>
                {facultyList.map((row) => (
                  <option key={row.id} value={row.id}>
                    {row.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-500">Branch</span>
              <select
                name="branch"
                defaultValue={branch}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
              >
                <option value="">All branches</option>
                {branches.map((row) => (
                  <option key={row.id} value={row.id}>
                    {row.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="submit"
              className="rounded-lg bg-[var(--accent,#2563eb)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
            >
              Apply filters
            </button>
            <Link
              href="/schedule"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Clear
            </Link>
            {hasFilter && (
              <span className="self-center text-xs text-slate-500">
                {entries.length} class{entries.length === 1 ? "" : "es"} found
              </span>
            )}
          </div>
        </form>

        {entries.length === 0 ? (
          <EmptyState
            message={
              hasFilter
                ? "No classes match these filters. Try clearing one of them."
                : "The timetable will appear here once classes are scheduled from the admin panel."
            }
          />
        ) : (
          <div className="space-y-10">
            {groups.map((group) => (
              <div key={group.day}>
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
                  <CalendarDays className="h-5 w-5 text-[var(--accent,#2563eb)]" />
                  {group.day}
                </h2>

                {/* Mobile cards */}
                <div className="grid gap-3 sm:hidden">
                  {group.rows.map((entry) => (
                    <article key={entry.id} className="rounded-xl border border-slate-200 bg-white p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium text-slate-900">
                          {entry.subject?.name || entry.course?.title || "Class"}
                        </p>
                        <span className="shrink-0 text-sm font-semibold text-[var(--accent,#2563eb)]">
                          {formatTime(entry.start_time)} – {formatTime(entry.end_time)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-600">
                        {[entry.faculty?.name, entry.batch?.name].filter(Boolean).join(" · ")}
                      </p>
                      <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <Monitor className="h-3.5 w-3.5" /> {entry.mode}
                        </span>
                        {entry.room && <span>Room {entry.room}</span>}
                        {entry.branch && <span>{entry.branch.name}</span>}
                        {entry.date && <span>{entry.date}</span>}
                      </p>
                    </article>
                  ))}
                </div>

                {/* Desktop table */}
                <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white sm:block">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Time</th>
                        <th className="px-4 py-3 font-semibold">Class</th>
                        <th className="px-4 py-3 font-semibold">Faculty</th>
                        <th className="px-4 py-3 font-semibold">Batch / Course</th>
                        <th className="px-4 py-3 font-semibold">Room / Mode</th>
                        <th className="px-4 py-3 font-semibold">Branch</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {group.rows.map((entry) => (
                        <tr key={entry.id} className="hover:bg-slate-50">
                          <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">
                            {formatTime(entry.start_time)} – {formatTime(entry.end_time)}
                          </td>
                          <td className="px-4 py-3 text-slate-800">
                            {entry.subject?.name || entry.course?.title || "Class"}
                          </td>
                          <td className="px-4 py-3 text-slate-700">{entry.faculty?.name || "—"}</td>
                          <td className="px-4 py-3 text-slate-700">
                            {entry.batch?.name || entry.course?.title || "—"}
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            {[entry.room && `Room ${entry.room}`, entry.mode].filter(Boolean).join(" · ")}
                          </td>
                          <td className="px-4 py-3 text-slate-700">{entry.branch?.name || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
