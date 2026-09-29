import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Download,
  FileText,
  Monitor,
  Target,
} from "lucide-react";
import { getInstitute } from "@/lib/data/settings";
import {
  getCourseBySlug,
  getCourseSlugs,
  getFacultyForCourse,
} from "@/lib/data/public";
import { FacultyCard, EmptyState, SectionHeading } from "@/components/site/Shared";
import { EnquiryForm } from "@/components/site/EnquiryForm";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { buildWhatsAppUrl, courseWhatsAppMessage } from "@/lib/utils/whatsapp";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = await getCourseSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course) return { title: "Course not found" };

  return {
    title: course.seo_title || course.title,
    description: course.seo_description || course.short_description || course.description,
  };
}

export default async function CourseDetailPage({ params }: Props) {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course) notFound();

  const institute = await getInstitute();
  const facultyRows = await getFacultyForCourse(course.id);
  const whatsappNumber = course.whatsapp_number || institute.whatsapp || institute.phone;

  return (
    <>
      <section className="border-b border-slate-200 bg-slate-50">
        <div className="container-site py-12">
          <Link
            href="/courses"
            className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-[var(--accent,#2563eb)]"
          >
            <ArrowLeft className="h-4 w-4" /> All courses
          </Link>

          <div className="mt-6 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
            <div>
              <div className="flex flex-wrap gap-2 text-[11px]">
                {course.category && (
                  <span className="rounded-full bg-white px-2.5 py-1 font-medium text-slate-600">
                    {course.category}
                  </span>
                )}
                {course.exam && (
                  <span className="rounded-full bg-white px-2.5 py-1 font-medium text-slate-600">
                    {course.exam}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 font-medium text-slate-600">
                  <Monitor className="h-3 w-3" /> {course.mode}
                </span>
              </div>

              <h1 className="mt-4 text-3xl font-semibold text-slate-900 sm:text-4xl">
                {course.title}
              </h1>
              {course.short_description && (
                <p className="mt-3 max-w-2xl text-sm text-slate-600 sm:text-base">
                  {course.short_description}
                </p>
              )}

              <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3 text-sm text-slate-600">
                {course.duration && (
                  <span className="inline-flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-400" /> {course.duration}
                  </span>
                )}
                {course.start_date && (
                  <span className="inline-flex items-center gap-2">
                    <Target className="h-4 w-4 text-slate-400" /> Starts {formatDate(course.start_date)}
                  </span>
                )}
              </div>
            </div>

            <aside className="rounded-2xl border border-slate-200 bg-white p-6">
              <p className="text-sm text-slate-500">Course fee</p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-3xl font-semibold text-slate-900">
                  {formatCurrency(course.fee)}
                </span>
                {course.original_price && course.original_price > course.fee && (
                  <span className="text-sm text-slate-400 line-through">
                    {formatCurrency(course.original_price)}
                  </span>
                )}
              </div>
              {course.discount && (
                <p className="mt-1 text-sm font-medium text-emerald-600">{course.discount}</p>
              )}

              <div className="mt-5 grid gap-2">
                <Link
                  href="/contact#enquiry"
                  className="rounded-full bg-[var(--accent,#2563eb)] px-4 py-2.5 text-center text-sm font-medium text-white hover:opacity-90"
                >
                  Enrol / enquire
                </Link>
                {whatsappNumber && (
                  <a
                    href={buildWhatsAppUrl(whatsappNumber, courseWhatsAppMessage(course.title))}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-emerald-600 px-4 py-2.5 text-center text-sm font-medium text-white hover:bg-emerald-700"
                  >
                    Ask on WhatsApp
                  </a>
                )}
                {course.brochure_url && (
                  <a
                    href={`/api/download?bucket=course-brochures&path=${encodeURIComponent(course.brochure_url)}`}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 px-4 py-2.5 text-center text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <Download className="h-4 w-4" /> Download brochure
                  </a>
                )}
              </div>

              {course.target_audience && (
                <p className="mt-4 text-xs text-slate-500">
                  <span className="font-medium text-slate-600">Best for:</span>{" "}
                  {course.target_audience}
                </p>
              )}
            </aside>
          </div>
        </div>
      </section>

      <section className="container-site grid gap-10 py-14 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-10">
          {course.description && (
            <div>
              <h2 className="text-lg font-semibold text-slate-900">About this course</h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-600">
                {course.description}
              </p>
            </div>
          )}

          {course.highlights?.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Highlights</h2>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {course.highlights.map((item, index) => (
                  <li key={index} className="flex gap-2 text-sm text-slate-600">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {course.syllabus?.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Syllabus coverage</h2>
              <ol className="mt-3 space-y-2">
                {course.syllabus.map((item, index) => (
                  <li
                    key={index}
                    className="flex gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600"
                  >
                    <span className="font-semibold text-[var(--accent,#2563eb)]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {course.eligibility && (
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Eligibility</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{course.eligibility}</p>
            </div>
          )}

          {course.gallery_urls?.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Course gallery</h2>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {course.gallery_urls.map((url, index) => (
                  <div
                    key={index}
                    className="relative aspect-[4/3] overflow-hidden rounded-lg border border-slate-200 bg-slate-100"
                  >
                    <Image
                      src={url}
                      alt={`${course.title} ${index + 1}`}
                      fill
                      sizes="(max-width: 640px) 50vw, 33vw"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <aside className="space-y-8">
          <div>
            <SectionHeading title="Faculty for this course" />
            {facultyRows.length ? (
              <div className="grid gap-4">
                {facultyRows.map((row) => (
                  <div key={row.faculty.id}>
                    <FacultyCard member={row.faculty} />
                    {row.subject && (
                      <p className="mt-1 text-center text-xs text-slate-500">
                        Teaches: {row.subject.name}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState message="Faculty details for this course are being updated." />
            )}
          </div>
        </aside>
      </section>

      <section className="border-t border-slate-200 bg-slate-50">
        <div className="container-site grid gap-8 py-14 lg:grid-cols-2">
          <div>
            <FileText className="h-6 w-6 text-[var(--accent,#2563eb)]" />
            <h2 className="mt-3 text-xl font-semibold text-slate-900">
              Have questions about {course.title}?
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Share your details and our admission team will call you back with batch dates, fees
              and syllabus information.
            </p>
          </div>
          <div id="enquiry" className="rounded-2xl border border-slate-200 bg-white p-6">
            <EnquiryForm
              courses={[{ id: course.id, title: course.title }]}
              source="course"
            />
          </div>
        </div>
      </section>
    </>
  );
}
