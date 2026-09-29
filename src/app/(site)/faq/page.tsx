import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getInstitute } from "@/lib/data/settings";
import { getActiveFaqs } from "@/lib/data/public";
import { EmptyState } from "@/components/site/Shared";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const institute = await getInstitute();
  return {
    title: "FAQ",
    description: `Answers to common questions about courses, batches and admissions at ${institute.name || "our institute"}.`,
  };
}

export default async function FaqPage() {
  const faqs = await getActiveFaqs();

  return (
    <>
      <section className="border-b border-slate-200 bg-slate-50">
        <div className="container-site py-14">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--accent,#2563eb)]">
            FAQ
          </p>
          <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
            Frequently asked questions
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-600 sm:text-base">
            Everything you need to know about admissions, batches, fees and learning modes.
          </p>
        </div>
      </section>

      <section className="container-site py-14">
        {faqs.length ? (
          <div className="max-w-3xl divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
            {faqs.map((faq) => (
              <details key={faq.id} className="group px-6 py-5">
                <summary className="cursor-pointer list-none text-sm font-medium text-slate-900">
                  {faq.question}
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{faq.answer}</p>
              </details>
            ))}
          </div>
        ) : (
          <EmptyState message="FAQs will appear here once they are added from the admin panel." />
        )}

        <div className="mt-10 max-w-3xl rounded-xl bg-slate-50 p-6 text-sm text-slate-600">
          Still have a question?{" "}
          <Link
            href="/contact#enquiry"
            className="font-medium text-[var(--accent,#2563eb)] hover:underline"
          >
            Send us an enquiry
          </Link>{" "}
          and we will get back to you.
        </div>
      </section>
    </>
  );
}
