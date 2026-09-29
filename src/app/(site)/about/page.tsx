import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { getInstitute, getSiteSettings } from "@/lib/data/settings";
import { getPublishedFaculty, getActiveSubjects } from "@/lib/data/public";
import { FacultyCard, SectionHeading, EmptyState } from "@/components/site/Shared";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const institute = await getInstitute();
  return {
    title: "About us",
    description: settingsDescription(institute),
  };
}

function settingsDescription(institute: { name: string; tagline: string; seo_description: string }) {
  return (
    institute.seo_description ||
    institute.tagline ||
    `Learn more about ${institute.name || "our coaching institute"}.`
  );
}

export default async function AboutPage() {
  const institute = await getInstitute();
  const settings = await getSiteSettings();
  const [faculty, subjects] = await Promise.all([
    getPublishedFaculty(),
    getActiveSubjects(),
  ]);
  const about = settings.about;

  const blocks = [
    { title: "Our vision", body: about.vision },
    { title: "Our mission", body: about.mission },
    { title: "Why choose us", body: about.why_choose_us },
    { title: "Teaching philosophy", body: about.teaching_philosophy },
    { title: "Our experience", body: about.experience },
    { title: "Achievements", body: about.achievements },
  ].filter((block) => block.body);

  return (
    <>
      <section className="border-b border-slate-200 bg-slate-50">
        <div className="container-site py-14">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--accent,#2563eb)]">
            About us
          </p>
          <h1 className="max-w-3xl text-3xl font-semibold text-slate-900 sm:text-4xl">
            {institute.name || "Coaching Institute"}
          </h1>
          {institute.tagline && (
            <p className="mt-3 text-slate-600">{institute.tagline}</p>
          )}
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
            {about.introduction}
          </p>
        </div>
      </section>

      <section className="container-site py-14">
        <div className="grid gap-6 sm:grid-cols-2">
          {blocks.map((block) => (
            <div
              key={block.title}
              className="rounded-xl border border-slate-200 bg-white p-6"
            >
              <h2 className="text-base font-semibold text-slate-900">{block.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{block.body}</p>
            </div>
          ))}
        </div>

        {about.cta && (
          <div className="mt-8 flex flex-col items-start gap-4 rounded-2xl bg-[var(--accent,#2563eb)] px-6 py-6 text-white sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm sm:text-base">{about.cta}</p>
            <Link
              href="/contact#enquiry"
              className="rounded-full bg-white px-5 py-2.5 text-sm font-medium text-[var(--accent,#2563eb)]"
            >
              Contact us
            </Link>
          </div>
        )}
      </section>

      <section className="bg-slate-50 py-14">
        <div className="container-site">
          <SectionHeading
            eyebrow="By the numbers"
            title="Our statistics"
            description="A snapshot of what we have built so far."
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {settings.stats.map((stat, index) => (
              <div
                key={index}
                className="rounded-xl border border-slate-200 bg-white p-6 text-center"
              >
                <p className="text-3xl font-semibold text-slate-900">{stat.value}</p>
                <p className="mt-1 text-sm text-slate-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-site py-14">
        <SectionHeading
          eyebrow="Subjects"
          title="Subjects we cover"
        />
        {subjects.length ? (
          <div className="flex flex-wrap gap-3">
            {subjects.map((subject) => (
              <span
                key={subject.id}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700"
              >
                {subject.name}
              </span>
            ))}
          </div>
        ) : (
          <EmptyState message="Subjects will appear here once they are added." />
        )}
      </section>

      <section className="border-t border-slate-200 bg-slate-50 py-14">
        <div className="container-site">
          <SectionHeading
            eyebrow="Our team"
            title="Meet the faculty"
            action={{ href: "/faculty", label: "View all faculty" }}
          />
          {faculty.length ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {faculty.slice(0, 4).map((member) => (
                <FacultyCard key={member.id} member={member} />
              ))}
            </div>
          ) : (
            <EmptyState message="Faculty profiles will appear here once published." />
          )}

          <ul className="mt-10 grid gap-3 sm:grid-cols-2">
            {settings.why_choose_us.map((item, index) => (
              <li key={index} className="flex gap-3 text-sm text-slate-600">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                <span>
                  <span className="font-medium text-slate-800">{item.title}</span> —{" "}
                  {item.description}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
