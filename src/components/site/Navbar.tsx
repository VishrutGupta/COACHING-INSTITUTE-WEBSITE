"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X, GraduationCap } from "lucide-react";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/courses", label: "Courses" },
  { href: "/batches", label: "Batches" },
  { href: "/schedule", label: "Schedule" },
  { href: "/faculty", label: "Faculty" },
  { href: "/results", label: "Results" },
  { href: "/announcements", label: "Notices" },
  { href: "/testimonials", label: "Testimonials" },
  { href: "/faq", label: "FAQ" },
  { href: "/gallery", label: "Gallery" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

interface Props {
  name: string;
  logoUrl: string | null;
}

export function Navbar({ name, logoUrl }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 border-b bg-white/90 backdrop-blur transition ${
        scrolled ? "border-slate-200 shadow-sm" : "border-transparent"
      }`}
    >
      <nav className="container-site flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex min-w-0 items-center gap-2">
          {logoUrl ? (
            <Image src={logoUrl} alt={name} width={32} height={32} className="h-8 w-8 rounded object-contain" />
          ) : (
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent,#2563eb)] text-white">
              <GraduationCap className="h-5 w-5" />
            </span>
          )}
          <span className="truncate text-base font-semibold text-slate-900">{name}</span>
        </Link>

        <div className="hidden items-center gap-0.5 xl:flex">
          {LINKS.map((link) => {
            const active =
              link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-2.5 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-[var(--accent,#2563eb)]/10 text-[var(--accent,#2563eb)]"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/contact#enquiry"
            className="hidden rounded-full bg-[var(--accent,#2563eb)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 sm:inline-flex"
          >
            Enquire now
          </Link>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 xl:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="border-t border-slate-200 bg-white xl:hidden">
          <div className="container-site grid gap-1 py-3">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/contact#enquiry"
              onClick={() => setOpen(false)}
              className="mt-1 rounded-lg bg-[var(--accent,#2563eb)] px-3 py-2 text-center text-sm font-medium text-white"
            >
              Enquire now
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
