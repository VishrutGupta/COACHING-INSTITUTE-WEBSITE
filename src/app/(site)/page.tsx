import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Award,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  MapPin,
  Megaphone,
  Phone,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";
import { getInstitute, getSiteSettings } from "@/lib/data/settings";
import {
  getPublishedCourses,
  getPublishedFaculty,
  getActiveSubjects,
  getActiveTestimonials,
  getActiveFaqs,
  getGalleryItems,
  getLiveAnnouncements,
  getPublishedBatches,
  getPublishedResults,
} from "@/lib/data/public";
import { ANNOUNCEMENT_CATEGORIES } from "@/lib/types";
import { formatTime } from "@/lib/utils/time";
import { CourseCard, FacultyCard, Rating, SectionHeading, EmptyState } from "@/components/site/Shared";
import { EnquiryForm } from "@/components/site/EnquiryForm";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const institute = await getInstitute();
  return {
    title: institute.seo_title || institute.name || "Coaching Institute",
    description:
      institute.seo_description ||
      institute.hero_description ||
      institute.tagline ||
      "Expert-led coaching courses with experienced faculty.",
  };
}

const SECTION_ICONS = [Target, BookOpen, Award, Sparkles];

export default async function HomePage() {
  const institute = await getInstitute();
  const settings = await getSiteSettings();
  const [courses, faculty, subjects, testimonials, faqs, gallery, announcements, batches, results] =
    await Promise.all([
      getPublishedCourses({ limit: 6 }),
      getPublishedFaculty(),
      getActiveSubjects(),
      getActiveTestimonials(6),
      getActiveFaqs(5),
      getGalleryItems(6),
      getLiveAnnouncements(3),
      getPublishedBatches(),
      getPublishedResults(3),
    ]);

  const upcomingBatches = batches.filter(
    (batch) => batch.status === "upcoming" || batch.status === "ongoing"
  );
  const noticeCategories = Object.fromEntries(
    ANNOUNCEMENT_CATEGORIES.map((row) => [row.value, row.label])
  );

  const displayName = institute.name || "Coaching Institute";

  return (
    <>
      {/* 1. Hero */}
      <section className="relative overflow-hidden bg-slate-900 text-white">
        <div className="absolute inset-0">
          {institute.hero_image_url && (
            <Image
              src={institute.hero_image_url}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover opacity-30"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/90 to-slate-900/60" />
        </div>

        <div className="container-site relative py-20 sm:py-28">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--accent,#60a5fa)]">
            {institute.tagline || "Admissions open"}
          </p>
          <h1 className="max-w-3xl text-3xl font-semibold leading-tight sm:text-5xl">
            {institute.hero_title || `Learn smarter at ${displayName}`}
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
            {institute.hero_description ||
              "Structured batches, expert faculty and consistent practice — everything you need to reach your target."}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/contact#enquiry"
              className="inline-flex items-center gap-2 rounded-full bg-[var(--accent,#2563eb)] px-6 py-3 text-sm font-medium text-white hover:opacity-90"
            >
              Enquire now <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 rounded-full border border-white/30 px-6 py-3 text-sm font-medium text-white hover:bg-white/10"
            >
              Browse courses
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Stats */}
      <section className="border-b border-slate-200 bg-white">
        <div className="container-site grid gap-6 py-10 sm:grid-cols-2 lg:grid-cols-4">
          {settings.stats.map((stat, index) => (
            <div key={index} className="text-center">
              <p className="text-3xl font-semibold text-slate-900">{stat.value}</p>
              <p className="mt-1 text-sm text-slate-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 2b. Announcements */}
      {announcements.length > 0 && (
        <section className="bg-white py-10">
          <div className="container-site">
            <SectionHeading
              eyebrow="Notices"
              title="Latest announcements"
              action={{ href: "/announcements", label: "All announcements" }}
            />
            <ul className="space-y-3">
              {announcements.map((row) => (
                <li
                  key={row.id}
                  className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent,#2563eb)]/10 px-3 py-1 text-[11px] font-semibold text-[var(--accent,#2563eb)]">
                      <Megaphone className="h-3 w-3" />
                      {noticeCategories[row.category] || row.category}
                    </span>
                    <span className="font-medium text-slate-900">{row.title}</span>
                  </div>
                  <span className="text-xs text-slate-500">
                    {row.publish_date
                      ? new Date(`${row.publish_date}T00:00:00`).toLocaleDateString()
                      : ""}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* 3. Why choose us */}
      <section className="container-site py-16">
        <SectionHeading
          eyebrow="Why choose us"
          title="Built for consistent results"
          description="The things that matter when you are preparing for a serious exam."
        />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {settings.why_choose_us.map((item, index) => {
            const Icon = SECTION_ICONS[index % SECTION_ICONS.length];
            return (
              <div
                key={index}
                className="rounded-xl border border-slate-200 bg-white p-6 transition hover:border-slate-300 hover:shadow-sm"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent,#2563eb)]/10 text-[var(--accent,#2563eb)]">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-base font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Featured courses */}
      <section className="bg-slate-50 py-16">
        <div className="container-site">
          <SectionHeading
            eyebrow="Courses"
            title="Popular programmes"
            description="Courses designed around syllabus coverage, practice and revision."
            action={{ href: "/courses", label: "View all courses" }}
          />
          {courses.length ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          ) : (
            <EmptyState message="No published courses yet. Courses added in the admin panel will appear here." />
          )}
        </div>
      </section>

      {/* 4b. Upcoming batches */}
      <section className="container-site py-16">
        <SectionHeading
          eyebrow="Batches"
          title="Upcoming & ongoing batches"
          description="Fixed timings, small groups and a clear schedule for every batch."
          action={{ href: "/batches", label: "See all batches" }}
        />
        {upcomingBatches.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {upcomingBatches.slice(0, 6).map((batch) => (
              <article
                key={batch.id}
                className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold text-slate-900">{batch.name}</h3>
                  <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold capitalize text-slate-600">
                    {batch.status}
                  </span>
                </div>
                {batch.course && (
                  <p className="mt-1 text-sm text-[var(--accent,#2563eb)]">{batch.course.title}</p>
                )}
                {batch.start_time && (
                  <p className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                    <CalendarDays className="h-4 w-4 text-slate-400" />
                    {formatTime(batch.start_time)} – {formatTime(batch.end_time)}
                    {batch.days.length > 0 && ` · ${batch.days.join(", ")}`}
                  </p>
                )}
                <p className="mt-2 text-sm text-slate-600">
                  {batch.mode}
                  {batch.room && ` · Room ${batch.room}`}
                  {batch.capacity > 0 && ` · ${batch.capacity} seats`}
                </p>
                <div className="mt-auto pt-4">
                  <Link
                    href="/batches"
                    className="text-sm font-medium text-[var(--accent,#2563eb)] hover:underline"
                  >
                    View batch details
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState message="New batches will be announced here as soon as admissions open." />
        )}
      </section>

      {/* 5. Subjects */}
      <section className="container-site py-16">
        <SectionHeading
          eyebrow="Subjects"
          title="What we teach"
          description="Subject coverage across school, board and competitive examination preparation."
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
          <EmptyState message="Subjects will appear here once they are added in the admin panel." />
        )}
      </section>

      {/* 6. Faculty */}
      <section className="bg-slate-50 py-16">
        <div className="container-site">
          <SectionHeading
            eyebrow="Faculty"
            title="Learn from experienced teachers"
            action={{ href: "/faculty", label: "Meet the full team" }}
          />
          {faculty.length ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {faculty.slice(0, 4).map((member) => (
                <FacultyCard key={member.id} member={member} />
              ))}
            </div>
          ) : (
            <EmptyState message="Faculty profiles will appear here once they are published." />
          )}
        </div>
      </section>

      {/* 7. Testimonials */}
      <section className="container-site py-16">
        <SectionHeading
          eyebrow="Testimonials"
          title="What students say"
          action={{ href: "/testimonials", label: "Read all reviews" }}
        />
        {testimonials.length ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((item) => (
              <figure key={item.id} className="rounded-xl border border-slate-200 bg-white p-6">
                <Rating value={item.rating} />
                <blockquote className="mt-3 text-sm leading-relaxed text-slate-700">
                  “{item.content}”
                </blockquote>
                <figcaption className="mt-4 text-sm">
                  <span className="font-medium text-slate-900">{item.name}</span>
                  <span className="text-slate-500">
                    {" "}
                    — {item.role}
                    {item.course ? `, ${item.course}` : ""}
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        ) : (
          <EmptyState message="Student testimonials will appear here once published." />
        )}
      </section>

      {/* 7b. Results */}
      <section className="bg-slate-50 py-16">
        <div className="container-site">
          <SectionHeading
            eyebrow="Results"
            title="Recent achievements"
            action={{ href: "/results", label: "View all results" }}
          />
          {results.length ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((row) => (
                <article
                  key={row.id}
                  className="rounded-xl border border-slate-200 bg-white p-6"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-900">{row.student_name}</p>
                    <Trophy className="h-5 w-5 text-amber-400" />
                  </div>
                  <p className="mt-1 text-sm text-slate-600">
                    {[row.exam, row.year].filter(Boolean).join(" · ")}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs">
                    {row.rank && (
                      <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
                        Rank {row.rank}
                      </span>
                    )}
                    {row.percentile && (
                      <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
                        {row.percentile} %ile
                      </span>
                    )}
                    {row.score && (
                      <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
                        {row.score}
                      </span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState message="Student results will be published here after the next exams." />
          )}
        </div>
      </section>

      {/* 8. Gallery preview */}
      <section className="bg-slate-50 py-16">
        <div className="container-site">
          <SectionHeading
            eyebrow="Gallery"
            title="Life at the institute"
            action={{ href: "/gallery", label: "Open gallery" }}
          />
          {gallery.length ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {gallery.map((item) => (
                <div
                  key={item.id}
                  className="relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-200"
                >
                  <Image
                    src={item.image_url}
                    alt={item.title || "Gallery image"}
                    fill
                    sizes="(max-width: 640px) 50vw, 33vw"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState message="Gallery photos will appear here once uploaded." />
          )}
        </div>
      </section>

      {/* 9. FAQ preview */}
      <section className="container-site py-16">
        <SectionHeading
          eyebrow="FAQ"
          title="Common questions"
          action={{ href: "/faq", label: "All questions" }}
        />
        {faqs.length ? (
          <div className="max-w-3xl divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
            {faqs.map((faq) => (
              <details key={faq.id} className="group px-5 py-4">
                <summary className="cursor-pointer list-none text-sm font-medium text-slate-900 marker:hidden">
                  {faq.question}
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{faq.answer}</p>
              </details>
            ))}
          </div>
        ) : (
          <EmptyState message="FAQs will appear here once they are added." />
        )}
      </section>

      {/* 10. About teaser */}
      <section className="bg-slate-50 py-16">
        <div className="container-site grid gap-8 lg:grid-cols-2 lg:items-center">
          <div>
            <SectionHeading
              eyebrow="About us"
              title={`Why students trust ${displayName}`}
              description={settings.about.introduction}
            />
            <ul className="space-y-3">
              {[settings.about.vision, settings.about.mission, settings.about
                .teaching_philosophy].map((text, index) => (
                <li key={index} className="flex gap-3 text-sm text-slate-600">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  <span>{text}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/about"
              className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-[var(--accent,#2563eb)] hover:underline"
            >
              Read our story <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Our track record
            </p>
            <p className="mt-3 text-2xl font-semibold text-slate-900">{settings.about.achievements}</p>
            <p className="mt-4 text-sm leading-relaxed text-slate-600">{settings.about.experience}</p>
            <p className="mt-4 text-sm font-medium text-[var(--accent,#2563eb)]">
              {settings.about.cta}
            </p>
          </div>
        </div>
      </section>

      {/* 11. Contact CTA */}
      <section className="container-site py-16">
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <SectionHeading
              eyebrow="Visit us"
              title="Talk to our admission team"
              description="Drop in or call us — we will help you pick the right batch."
            />
            <ul className="space-y-4 text-sm text-slate-700">
              {institute.address && (
                <li className="flex gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <span>{institute.address}</span>
                </li>
              )}
              {institute.phone && (
                <li className="flex gap-3">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <a href={`tel:${institute.phone}`} className="hover:text-[var(--accent,#2563eb)]">
                    {institute.phone}
                  </a>
                </li>
              )}
            </ul>
            <p className="mt-4 text-sm text-slate-500">
              {institute.opening_hours || "Contact us for batch timings."}
            </p>
          </div>

          <div id="enquiry" className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
            <EnquiryForm courses={courses.map((course) => ({ id: course.id, title: course.title }))} source="home" />
          </div>
        </div>
      </section>
    </>
  );
}
