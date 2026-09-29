import React from "react";
import type { Metadata } from "next";
import Image from "next/image";
import { getInstitute } from "@/lib/data/settings";
import { getGalleryItems } from "@/lib/data/public";
import { EmptyState } from "@/components/site/Shared";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const institute = await getInstitute();
  return {
    title: "Gallery",
    description: `Photos from classrooms, events and campus life at ${institute.name || "our institute"}.`,
  };
}

export default async function GalleryPage() {
  const items = await getGalleryItems();
  const categories = Array.from(new Set(items.map((item) => item.category).filter(Boolean)));

  return (
    <>
      <section className="border-b border-slate-200 bg-slate-50">
        <div className="container-site py-14">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--accent,#2563eb)]">
            Gallery
          </p>
          <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
            Life at the institute
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-600 sm:text-base">
            Classrooms, events, celebrations and moments from our campus.
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

        {items.length ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((item) => (
              <figure
                key={item.id}
                className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-200"
              >
                <Image
                  src={item.image_url}
                  alt={item.title || "Gallery image"}
                  fill
                  sizes="(max-width: 640px) 50vw, 25vw"
                  className="object-cover transition group-hover:scale-105"
                />
                {(item.title || item.description) && (
                  <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-xs text-white opacity-0 transition group-hover:opacity-100">
                    <span className="font-medium">{item.title}</span>
                    {item.description && <p className="mt-0.5">{item.description}</p>}
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
        ) : (
          <EmptyState message="Photos will appear here once they are uploaded from the admin panel." />
        )}
      </section>
    </>
  );
}
