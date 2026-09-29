import React from "react";
import type { Metadata } from "next";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { getInstitute } from "@/lib/data/settings";
import { getPublishedCourses } from "@/lib/data/public";
import { EnquiryForm } from "@/components/site/EnquiryForm";
import { buildWhatsAppUrl } from "@/lib/utils/whatsapp";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const institute = await getInstitute();
  return {
    title: "Contact",
    description: `Get in touch with ${institute.name || "our institute"} for admissions and batch details.`,
  };
}

export default async function ContactPage() {
  const institute = await getInstitute();
  const courses = await getPublishedCourses();
  const whatsappNumber = institute.whatsapp || institute.phone;

  const channels = [
    {
      icon: Phone,
      label: "Phone",
      value: institute.phone,
      href: institute.phone ? `tel:${institute.phone}` : undefined,
    },
    {
      icon: Mail,
      label: "Email",
      value: institute.email,
      href: institute.email ? `mailto:${institute.email}` : undefined,
    },
    { icon: MapPin, label: "Address", value: institute.address },
    { icon: Clock, label: "Opening hours", value: institute.opening_hours },
  ].filter((channel) => channel.value);

  return (
    <>
      <section className="border-b border-slate-200 bg-slate-50">
        <div className="container-site py-14">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--accent,#2563eb)]">
            Contact
          </p>
          <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
            We would love to hear from you
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-600 sm:text-base">
            {institute.admission_contact ||
              "Ask about courses, fees, batch timings or anything else — our admission team will help."}
          </p>
        </div>
      </section>

      <section className="container-site grid gap-10 py-14 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {channels.map((channel) => (
              <div
                key={channel.label}
                className="rounded-xl border border-slate-200 bg-white p-5"
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent,#2563eb)]/10 text-[var(--accent,#2563eb)]">
                  <channel.icon className="h-4 w-4" />
                </span>
                <p className="mt-3 text-xs font-medium uppercase tracking-wide text-slate-500">
                  {channel.label}
                </p>
                {channel.href ? (
                  <a
                    href={channel.href}
                    className="mt-1 block text-sm font-medium text-slate-800 hover:text-[var(--accent,#2563eb)]"
                  >
                    {channel.value}
                  </a>
                ) : (
                  <p className="mt-1 text-sm font-medium text-slate-800">{channel.value}</p>
                )}
              </div>
            ))}
          </div>

          {whatsappNumber && (
            <a
              href={buildWhatsAppUrl(
                whatsappNumber,
                "Hi, I would like to know about your courses and batch timings."
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-medium text-white hover:bg-emerald-700"
            >
              <MessageCircle className="h-4 w-4" /> Chat with us on WhatsApp
            </a>
          )}

          {institute.google_maps_url && (
            <a
              href={institute.google_maps_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-xl border border-slate-200 bg-white px-5 py-3 text-center text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Open location in Google Maps
            </a>
          )}
        </div>

        <div id="enquiry" className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-slate-900">Send an enquiry</h2>
          <p className="mt-1 mb-5 text-sm text-slate-500">
            We usually respond within one working day.
          </p>
          <EnquiryForm
            courses={courses.map((course) => ({ id: course.id, title: course.title }))}
            source="contact"
          />
        </div>
      </section>
    </>
  );
}
