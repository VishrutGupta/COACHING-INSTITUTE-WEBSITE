import React from "react";
import type { Metadata } from "next";
import { Megaphone } from "lucide-react";
import { getInstitute } from "@/lib/data/settings";
import { getLiveAnnouncements } from "@/lib/data/public";
import { EmptyState } from "@/components/site/Shared";
import { ANNOUNCEMENT_CATEGORIES, type AnnouncementCategory } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const institute = await getInstitute();
  return {
    title: "Announcements",
    description: `Notices, holidays and exam updates from ${institute.name || "our institute"}.`,
  };
}

const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  ANNOUNCEMENT_CATEGORIES.map((row) => [row.value, row.label])
);

const CATEGORY_STYLES: Record<string, string> = {
  new_batch: "bg-sky-100 text-sky-700",
  admission: "bg-emerald-100 text-emerald-700",
  results: "bg-violet-100 text-violet-700",
  holiday: "bg-amber-100 text-amber-800",
  exam: "bg-orange-100 text-orange-700",
  important: "bg-red-100 text-red-700",
} satisfies Record<AnnouncementCategory, string>;

function formatDate(value: string | null): string {
  if (!value) return "";
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function AnnouncementsPage() {
  const announcements = await getLiveAnnouncements();

  return (
    <>
      <section className="border-b border-slate-200 bg-slate-50">
        <div className="container-site py-14">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--accent,#2563eb)]">
            Announcements
          </p>
          <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
            Notices &amp; updates
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-600 sm:text-base">
            New batches, admissions, holidays and exam schedules — everything in one place.
          </p>
        </div>
      </section>

      <section className="container-site py-14">
        {announcements.length ? (
          <ul className="space-y-4">
            {announcements.map((row) => (
              <li
                key={row.id}
                className={`rounded-xl border bg-white p-5 transition sm:p-6 ${
                  row.featured
                    ? "border-[var(--accent,#2563eb)]/40 shadow-sm"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                      CATEGORY_STYLES[row.category] || "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {CATEGORY_LABELS[row.category] || row.category}
                  </span>
                  {row.publish_date && (
                    <span className="text-xs text-slate-500">{formatDate(row.publish_date)}</span>
                  )}
                  {row.expiry_date && (
                    <span className="text-xs text-slate-400">
                      Valid till {formatDate(row.expiry_date)}
                    </span>
                  )}
                </div>

                <h2 className="mt-3 flex items-start gap-2 text-lg font-semibold text-slate-900">
                  <Megaphone className="mt-1 h-4 w-4 shrink-0 text-[var(--accent,#2563eb)]" />
                  {row.title}
                </h2>

                {row.content && (
                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-600">
                    {row.content}
                  </p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState message="No announcements right now. Check back soon for new batches and exam updates." />
        )}
      </section>
    </>
  );
}
