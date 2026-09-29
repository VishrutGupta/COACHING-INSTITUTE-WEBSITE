import React from "react";
import type { Metadata } from "next";
import { getInstitute } from "@/lib/data/settings";
import { getPublishedCourses } from "@/lib/data/public";
import { CourseCard, EmptyState, SectionHeading } from "@/components/site/Shared";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const institute = await getInstitute();
  return {
    title: "Courses",
    description: `Explore the courses and batches offered by ${institute.name || "our institute"}.`,
  };
}

export default async function CoursesPage() {
  const courses = await getPublishedCourses();

  const categories = Array.from(
    new Set(courses.map((course) => course.category).filter(Boolean))
  );

  return (
    <>
      <section className="border-b border-slate-200 bg-slate-50">
        <div className="container-site py-14">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--accent,#2563eb)]">
            Courses
          </p>
          <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
            Find the right batch for your goal
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-600 sm:text-base">
            Every course includes a structured syllabus, regular practice and progress tracking.
          </p>
        </div>
      </section>

      <section className="container-site py-14">
        {categories.length > 0 && (
          <div className="mb-8 flex flex-wrap gap-2">
            {categories.map((category) => (
              <span
                key={category}
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600"
              >
                {category}
              </span>
            ))}
          </div>
        )}

        {courses.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <EmptyState message="No courses are published yet. Check back soon or contact us for details." />
        )}
      </section>

      <section className="border-t border-slate-200 bg-slate-50">
        <div className="container-site py-14">
          <SectionHeading
            title="Need help choosing?"
            description="Tell us your target exam and we will recommend a batch."
            action={{ href: "/contact#enquiry", label: "Talk to a counsellor" }}
          />
        </div>
      </section>
    </>
  );
}
