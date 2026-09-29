import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Clock, Monitor, Users, Star } from "lucide-react";
import type { Course, Faculty } from "@/lib/types";
import { formatCurrency } from "@/lib/utils/format";

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        {eyebrow && (
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--accent,#2563eb)]">
            {eyebrow}
          </p>
        )}
        <h2 className="text-2xl font-semibold text-slate-900 sm:text-3xl">{title}</h2>
        {description && <p className="mt-2 text-sm text-slate-600 sm:text-base">{description}</p>}
      </div>
      {action && (
        <Link
          href={action.href}
          className="inline-flex items-center gap-1 text-sm font-medium text-[var(--accent,#2563eb)] hover:underline"
        >
          {action.label} <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-500">
      {message}
    </div>
  );
}

export function CourseCard({ course }: { course: Course }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:border-slate-300 hover:shadow-md">
      <div className="relative aspect-[16/9] bg-slate-100">
        {course.cover_image_url ? (
          <Image
            src={course.cover_image_url}
            alt={course.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            No image
          </div>
        )}
        {course.featured && (
          <span className="absolute left-3 top-3 rounded-full bg-amber-400 px-2 py-0.5 text-[11px] font-semibold text-amber-950">
            Featured
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap gap-2 text-[11px]">
          {course.category && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600">
              {course.category}
            </span>
          )}
          {course.mode && (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600">
              <Monitor className="h-3 w-3" /> {course.mode}
            </span>
          )}
          {course.duration && (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600">
              <Clock className="h-3 w-3" /> {course.duration}
            </span>
          )}
        </div>

        <h3 className="mt-3 text-lg font-semibold text-slate-900">{course.title}</h3>
        {course.short_description && (
          <p className="mt-1 line-clamp-2 text-sm text-slate-600">{course.short_description}</p>
        )}

        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-lg font-semibold text-slate-900">
            {formatCurrency(course.fee)}
          </span>
          {course.original_price && course.original_price > course.fee && (
            <span className="text-sm text-slate-400 line-through">
              {formatCurrency(course.original_price)}
            </span>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between pt-4">
          <Link
            href={`/courses/${course.slug}`}
            className="text-sm font-medium text-[var(--accent,#2563eb)] hover:underline"
          >
            View details
          </Link>
          <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-[var(--accent,#2563eb)]" />
        </div>
      </div>
    </article>
  );
}

export function FacultyCard({ member }: { member: Faculty }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white p-5 text-center transition hover:border-slate-300 hover:shadow-md">
      <div className="mx-auto h-24 w-24 overflow-hidden rounded-full bg-slate-100">
        {member.profile_image ? (
          <Image
            src={member.profile_image}
            alt={member.name}
            width={96}
            height={96}
            className="h-24 w-24 object-cover"
          />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center text-xl font-semibold text-slate-400">
            {(member.name || "?").charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      <h3 className="mt-4 text-base font-semibold text-slate-900">{member.name}</h3>
      <p className="text-sm text-slate-500">{member.designation}</p>
      {member.subject && (
        <p className="mt-1 text-sm font-medium text-[var(--accent,#2563eb)]">{member.subject}</p>
      )}
      <p className="mt-2 line-clamp-3 text-sm text-slate-600">{member.bio}</p>

      <div className="mt-3 flex flex-wrap justify-center gap-2 text-[11px] text-slate-500">
        {member.experience && (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5">
            <Users className="h-3 w-3" /> {member.experience}
          </span>
        )}
        {member.qualification && (
          <span className="rounded-full bg-slate-100 px-2 py-0.5">{member.qualification}</span>
        )}
      </div>

      <Link
        href={`/faculty/${member.slug}`}
        className="mt-4 inline-flex items-center justify-center gap-1 text-sm font-medium text-[var(--accent,#2563eb)] hover:underline"
      >
        View profile <ArrowRight className="h-4 w-4" />
      </Link>
    </article>
  );
}

export function Rating({ value }: { value: number }) {
  const rating = Math.round(value || 0);
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={`h-4 w-4 ${index < rating ? "fill-amber-400 text-amber-400" : "text-slate-300"}`}
        />
      ))}
    </div>
  );
}
