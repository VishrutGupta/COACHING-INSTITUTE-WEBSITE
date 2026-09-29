import React from "react";
import Link from "next/link";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import {
  FacebookIcon,
  InstagramIcon,
  LinkedinIcon,
  YoutubeIcon,
} from "@/components/site/SocialIcons";
import type { Institute } from "@/lib/types";

const QUICK_LINKS = [
  { href: "/courses", label: "Courses" },
  { href: "/faculty", label: "Faculty" },
  { href: "/about", label: "About us" },
  { href: "/gallery", label: "Gallery" },
  { href: "/testimonials", label: "Testimonials" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

export function Footer({ institute }: { institute: Institute }) {
  const socials = [
    { href: institute.instagram_url, icon: InstagramIcon, label: "Instagram" },
    { href: institute.facebook_url, icon: FacebookIcon, label: "Facebook" },
    { href: institute.youtube_url, icon: YoutubeIcon, label: "YouTube" },
    { href: institute.linkedin_url, icon: LinkedinIcon, label: "LinkedIn" },
  ].filter((item) => Boolean(item.href));

  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="container-site grid gap-10 py-12 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-lg font-semibold text-slate-900">
            {institute.name || "Coaching Institute"}
          </p>
          {institute.tagline && (
            <p className="mt-2 text-sm text-slate-600">{institute.tagline}</p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            {socials.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.label}
                className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 hover:text-[var(--accent,#2563eb)]"
              >
                <social.icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Quick links
          </p>
          <ul className="mt-4 space-y-2">
            {QUICK_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-slate-600 hover:text-[var(--accent,#2563eb)]"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Contact
          </p>
          <ul className="mt-4 space-y-3 text-sm text-slate-600">
            {institute.address && (
              <li className="flex gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                <span>{institute.address}</span>
              </li>
            )}
            {institute.phone && (
              <li className="flex gap-2">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                <a href={`tel:${institute.phone}`} className="hover:text-[var(--accent,#2563eb)]">
                  {institute.phone}
                </a>
              </li>
            )}
            {institute.email && (
              <li className="flex gap-2">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                <a href={`mailto:${institute.email}`} className="hover:text-[var(--accent,#2563eb)]">
                  {institute.email}
                </a>
              </li>
            )}
            {institute.opening_hours && (
              <li className="flex gap-2">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                <span>{institute.opening_hours}</span>
              </li>
            )}
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Admissions
          </p>
          <p className="mt-4 text-sm text-slate-600">
            {institute.admission_contact || "Talk to our counsellors about the right batch for you."}
          </p>
          <Link
            href="/contact#enquiry"
            className="mt-4 inline-flex rounded-full bg-[var(--accent,#2563eb)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Request a callback
          </Link>
        </div>
      </div>

      <div className="border-t border-slate-200">
        <div className="container-site flex flex-col gap-2 py-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {institute.name || "Coaching Institute"}. All rights
            reserved.
          </p>
          <p>{institute.footer_text}</p>
        </div>
      </div>
    </footer>
  );
}
