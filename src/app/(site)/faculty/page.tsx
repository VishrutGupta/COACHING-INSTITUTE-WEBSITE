import React from "react";
import type { Metadata } from "next";
import { getInstitute } from "@/lib/data/settings";
import { getPublishedFaculty } from "@/lib/data/public";
import { FacultyCard, EmptyState } from "@/components/site/Shared";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const institute = await getInstitute();
  return {
    title: "Faculty",
    description: `Meet the teaching team at ${institute.name || "our institute"}.`,
  };
}

export default async function FacultyPage() {
  const faculty = await getPublishedFaculty();

  return (
    <>
      <section className="border-b border-slate-200 bg-slate-50">
        <div className="container-site py-14">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--accent,#2563eb)]">
            Faculty
          </p>
          <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
            The people behind your preparation
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-600 sm:text-base">
            Experienced teachers who specialise in their subjects and stay involved in your
            progress.
          </p>
        </div>
      </section>

      <section className="container-site py-14">
        {faculty.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {faculty.map((member) => (
              <FacultyCard key={member.id} member={member} />
            ))}
          </div>
        ) : (
          <EmptyState message="Faculty profiles will appear here once they are published." />
        )}
      </section>
    </>
  );
}
