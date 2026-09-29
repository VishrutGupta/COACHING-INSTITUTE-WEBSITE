import React from "react";
import type { Metadata } from "next";
import { getInstitute } from "@/lib/data/settings";
import { getActiveTestimonials } from "@/lib/data/public";
import { EmptyState, Rating } from "@/components/site/Shared";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const institute = await getInstitute();
  return {
    title: "Testimonials",
    description: `Reviews and results shared by students of ${institute.name || "our institute"}.`,
  };
}

export default async function TestimonialsPage() {
  const testimonials = await getActiveTestimonials();

  return (
    <>
      <section className="border-b border-slate-200 bg-slate-50">
        <div className="container-site py-14">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--accent,#2563eb)]">
            Testimonials
          </p>
          <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
            Stories from our students
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-600 sm:text-base">
            Honest feedback from students and parents about their experience with us.
          </p>
        </div>
      </section>

      <section className="container-site py-14">
        {testimonials.length ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((item) => (
              <figure key={item.id} className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-6">
                <Rating value={item.rating} />
                <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-slate-700">
                  “{item.content}”
                </blockquote>
                <figcaption className="mt-4 border-t border-slate-100 pt-4 text-sm">
                  <span className="font-medium text-slate-900">{item.name}</span>
                  <span className="text-slate-500">
                    {" "}
                    — {item.role}
                    {item.course ? `, ${item.course}` : ""}
                    {item.year ? ` (${item.year})` : ""}
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        ) : (
          <EmptyState message="Student testimonials will appear here once published." />
        )}
      </section>
    </>
  );
}
