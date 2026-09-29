import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, Award, BookOpen, Users } from "lucide-react";
import { LinkedinIcon } from "@/components/site/SocialIcons";
import {
  getFacultyBySlug,
  getFacultySlugs,
  getCoursesForFaculty,
} from "@/lib/data/public";
import { CourseCard, EmptyState } from "@/components/site/Shared";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = await getFacultySlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const member = await getFacultyBySlug(slug);
  if (!member) return { title: "Faculty member not found" };

  return {
    title: member.name,
    description: member.bio || `${member.name} — ${member.designation} at our institute.`,
  };
}

export default async function FacultyDetailPage({ params }: Props) {
  const { slug } = await params;
  const member = await getFacultyBySlug(slug);
  if (!member) notFound();

  const courses = await getCoursesForFaculty(member.id);
  const socials = Object.entries(member.social_links || {}).filter(([, url]) => Boolean(url));

  const facts = [
    { icon: BookOpen, label: "Subject", value: member.subject },
    { icon: Users, label: "Experience", value: member.experience },
    { icon: Award, label: "Qualification", value: member.qualification },
  ].filter((fact) => fact.value);

  return (
    <>
      <section className="border-b border-slate-200 bg-slate-50">
        <div className="container-site py-12">
          <Link
            href="/faculty"
            className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-[var(--accent,#2563eb)]"
          >
            <ArrowLeft className="h-4 w-4" /> All faculty
          </Link>

          <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="h-32 w-32 shrink-0 overflow-hidden rounded-2xl bg-slate-200">
              {member.profile_image ? (
                <Image
                  src={member.profile_image}
                  alt={member.name}
                  width={128}
                  height={128}
                  className="h-32 w-32 object-cover"
                />
              ) : (
                <div className="flex h-32 w-32 items-center justify-center text-3xl font-semibold text-slate-400">
                  {(member.name || "?").charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div>
              <h1 className="text-3xl font-semibold text-slate-900">{member.name}</h1>
              <p className="mt-1 text-slate-600">{member.designation}</p>
              {member.subject && (
                <p className="mt-1 text-sm font-medium text-[var(--accent,#2563eb)]">
                  {member.subject}
                </p>
              )}

              <div className="mt-4 flex flex-wrap gap-3">
                {member.linkedin_url && (
                  <a
                    href={member.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <LinkedinIcon className="h-4 w-4" /> LinkedIn
                  </a>
                )}
                {socials.map(([network, url]) => (
                  <a
                    key={network}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium capitalize text-slate-700 hover:bg-slate-50"
                  >
                    {network}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container-site grid gap-10 py-14 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-8">
          {member.bio && (
            <div>
              <h2 className="text-lg font-semibold text-slate-900">About</h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-600">
                {member.bio}
              </p>
            </div>
          )}

          {member.specialization && (
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Specialisation</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{member.specialization}</p>
            </div>
          )}

          {member.achievements && (
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Achievements</h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-600">
                {member.achievements}
              </p>
            </div>
          )}

          <div>
            <h2 className="text-lg font-semibold text-slate-900">Courses taught</h2>
            <div className="mt-4">
              {courses.length ? (
                <div className="grid gap-6 sm:grid-cols-2">
                  {courses.map((course) => (
                    <CourseCard key={course.id} course={course} />
                  ))}
                </div>
              ) : (
                <EmptyState message="Courses taught by this faculty member will appear here." />
              )}
            </div>
          </div>
        </div>

        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            At a glance
          </p>
          <ul className="mt-4 space-y-4">
            {facts.map((fact) => (
              <li key={fact.label} className="flex gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent,#2563eb)]/10 text-[var(--accent,#2563eb)]">
                  <fact.icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-xs text-slate-500">{fact.label}</p>
                  <p className="text-sm font-medium text-slate-800">{fact.value}</p>
                </div>
              </li>
            ))}
          </ul>

          <Link
            href="/contact#enquiry"
            className="mt-6 block rounded-full bg-[var(--accent,#2563eb)] px-4 py-2.5 text-center text-sm font-medium text-white hover:opacity-90"
          >
            Talk to us about batches
          </Link>
        </aside>
      </section>
    </>
  );
}
