import React from "react";
import type { Metadata } from "next";
import Image from "next/image";
import { Trophy } from "lucide-react";
import { getInstitute } from "@/lib/data/settings";
import { getPublishedResults } from "@/lib/data/public";
import { EmptyState, SectionHeading } from "@/components/site/Shared";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const institute = await getInstitute();
  return {
    title: "Results",
    description: `Results and achievements of students at ${institute.name || "our institute"}.`,
  };
}

export default async function ResultsPage() {
  const results = await getPublishedResults();
  const years = Array.from(
    new Set(results.map((row) => row.year).filter((year): year is number => Boolean(year)))
  ).sort((a, b) => b - a);

  return (
    <>
      <section className="border-b border-slate-200 bg-slate-50">
        <div className="container-site py-14">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--accent,#2563eb)]">
            Results
          </p>
          <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
            Achievements that speak for themselves
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-600 sm:text-base">
            Ranks and scores of our students in their target examinations.
          </p>
        </div>
      </section>

      <section className="container-site py-14">
        {years.length > 0 && (
          <div className="mb-8 flex flex-wrap gap-2">
            {years.map((year) => (
              <span
                key={year}
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600"
              >
                {year}
              </span>
            ))}
          </div>
        )}

        {results.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((row) => (
              <article
                key={row.id}
                className={`flex h-full flex-col overflow-hidden rounded-xl border bg-white transition hover:shadow-md ${
                  row.featured ? "border-amber-300" : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="relative aspect-[16/10] bg-slate-100">
                  {row.image_url ? (
                    <Image
                      src={row.image_url}
                      alt={`${row.student_name} — ${row.exam}`}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Trophy className="h-10 w-10 text-slate-300" />
                    </div>
                  )}
                  {row.featured && (
                    <span className="absolute left-3 top-3 rounded-full bg-amber-400 px-2 py-0.5 text-[11px] font-semibold text-amber-950">
                      Topper
                    </span>
                  )}
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-lg font-semibold text-slate-900">{row.student_name}</h2>
                    {row.year && (
                      <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                        {row.year}
                      </span>
                    )}
                  </div>
                  {row.exam && <p className="mt-0.5 text-sm text-slate-600">{row.exam}</p>}

                  <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-slate-50 px-2 py-2">
                      <dt className="text-[11px] uppercase tracking-wide text-slate-500">Rank</dt>
                      <dd className="text-sm font-semibold text-slate-900">{row.rank || "—"}</dd>
                    </div>
                    <div className="rounded-lg bg-slate-50 px-2 py-2">
                      <dt className="text-[11px] uppercase tracking-wide text-slate-500">
                        Percentile
                      </dt>
                      <dd className="text-sm font-semibold text-slate-900">{row.percentile || "—"}</dd>
                    </div>
                    <div className="rounded-lg bg-slate-50 px-2 py-2">
                      <dt className="text-[11px] uppercase tracking-wide text-slate-500">Score</dt>
                      <dd className="text-sm font-semibold text-slate-900">{row.score || "—"}</dd>
                    </div>
                  </dl>

                  {row.description && (
                    <p className="mt-3 line-clamp-3 text-sm text-slate-600">{row.description}</p>
                  )}

                  <p className="mt-auto pt-4 text-xs text-slate-500">
                    {row.course ? row.course.title : "Institute student"}
                  </p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState message="Results will be published here as soon as the next examination results are out." />
        )}
      </section>

      <section className="border-t border-slate-200 bg-slate-50">
        <div className="container-site py-14">
          <SectionHeading
            title="Want to be on this wall?"
            description="Enrol for the upcoming session and start your preparation today."
            action={{ href: "/contact#enquiry", label: "Enquire now" }}
          />
        </div>
      </section>
    </>
  );
}
