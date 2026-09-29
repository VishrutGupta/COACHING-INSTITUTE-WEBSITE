import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, Clock, MapPin, Monitor, Users } from "lucide-react";
import { getInstitute } from "@/lib/data/settings";
import { getPublishedBatches } from "@/lib/data/public";
import { EmptyState, SectionHeading } from "@/components/site/Shared";
import { formatTime } from "@/lib/utils/time";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const institute = await getInstitute();
  return {
    title: "Batches",
    description: `Upcoming and ongoing batches at ${institute.name || "our institute"}.`,
  };
}

const STATUS_STYLES: Record<string, string> = {
  upcoming: "bg-sky-100 text-sky-700",
  ongoing: "bg-emerald-100 text-emerald-700",
  completed: "bg-slate-100 text-slate-600",
  cancelled: "bg-red-100 text-red-700",
};

const STATUS_LABELS: Record<string, string> = {
  upcoming: "Upcoming",
  ongoing: "Ongoing",
  completed: "Completed",
  cancelled: "Cancelled",
};

function formatDate(value: string | null): string {
  if (!value) return "";
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function BatchesPage() {
  const batches = await getPublishedBatches();

  return (
    <>
      <section className="border-b border-slate-200 bg-slate-50">
        <div className="container-site py-14">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--accent,#2563eb)]">
            Batches
          </p>
          <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
            Join a batch that fits your schedule
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-600 sm:text-base">
            Small batches, fixed timings and personal attention. Seats are limited per batch.
          </p>
        </div>
      </section>

      <section className="container-site py-14">
        {batches.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {batches.map((batch) => (
              <article
                key={batch.id}
                className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-lg font-semibold text-slate-900">{batch.name}</h2>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_STYLES[batch.status] || "bg-slate-100 text-slate-600"}`}
                  >
                    {STATUS_LABELS[batch.status] || batch.status}
                  </span>
                </div>

                {batch.course && (
                  <Link
                    href={`/courses/${batch.course.slug}`}
                    className="mt-1 text-sm font-medium text-[var(--accent,#2563eb)] hover:underline"
                  >
                    {batch.course.title}
                  </Link>
                )}

                {batch.description && (
                  <p className="mt-2 line-clamp-3 text-sm text-slate-600">{batch.description}</p>
                )}

                <dl className="mt-4 space-y-2 text-sm text-slate-600">
                  {batch.start_time && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 shrink-0 text-slate-400" />
                      <span>
                        {formatTime(batch.start_time)} – {formatTime(batch.end_time)}
                        {batch.days.length > 0 && ` · ${batch.days.join(", ")}`}
                      </span>
                    </div>
                  )}
                  {(batch.start_date || batch.end_date) && (
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 shrink-0 text-slate-400" />
                      <span>
                        {formatDate(batch.start_date)}
                        {batch.start_date && batch.end_date && " → "}
                        {formatDate(batch.end_date)}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4 shrink-0 text-slate-400" />
                    <span>
                      {batch.mode}
                      {batch.room && ` · Room ${batch.room}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 shrink-0 text-slate-400" />
                    <span>
                      {batch.capacity > 0 ? `Up to ${batch.capacity} seats` : "Limited seats"}
                    </span>
                  </div>
                  {batch.branch && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
                      <span>{batch.branch.name}</span>
                    </div>
                  )}
                </dl>

                {batch.faculty && (
                  <p className="mt-4 text-sm text-slate-700">
                    Faculty:{" "}
                    <Link
                      href={`/faculty/${batch.faculty.slug}`}
                      className="font-medium text-[var(--accent,#2563eb)] hover:underline"
                    >
                      {batch.faculty.name}
                    </Link>
                  </p>
                )}

                <div className="mt-auto pt-5">
                  <Link
                    href="/contact#enquiry"
                    className="inline-flex w-full items-center justify-center rounded-lg bg-[var(--accent,#2563eb)] px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
                  >
                    Enquire about this batch
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState message="No batches are open right now. Contact us to be notified about the next one." />
        )}
      </section>

      <section className="border-t border-slate-200 bg-slate-50">
        <div className="container-site py-14">
          <SectionHeading
            title="Not sure which batch suits you?"
            description="Share your target exam and available hours — we will suggest the right batch."
            action={{ href: "/contact#enquiry", label: "Talk to a counsellor" }}
          />
        </div>
      </section>
    </>
  );
}
