import React from "react";
import type { Metadata } from "next";
import { getInstitute } from "@/lib/data/settings";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const institute = await getInstitute();
  const title = institute.seo_title || institute.name || "Coaching Institute";
  const description =
    institute.seo_description ||
    institute.tagline ||
    "Expert-led courses, experienced faculty and results-driven coaching.";

  return {
    title: {
      default: title,
      template: `%s | ${institute.name || "Coaching Institute"}`,
    },
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
  };
}

export default async function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const institute = await getInstitute();

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{ ["--accent" as keyof React.CSSProperties]: institute.accent_color || "#2563eb" }}
    >
      <Navbar name={institute.name || "Coaching Institute"} logoUrl={institute.logo_url} />
      <main className="flex-1">{children}</main>
      <Footer institute={institute} />
      <WhatsAppButton number={institute.whatsapp || institute.phone} />
    </div>
  );
}
