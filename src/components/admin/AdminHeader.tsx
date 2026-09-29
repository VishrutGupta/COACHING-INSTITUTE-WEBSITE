"use client";

import React from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

interface Props {
  user: { name: string; username: string; role: string };
}

export function AdminHeader({ user }: Props) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 min-w-0">
          <span className="truncate text-sm font-medium text-slate-900">{user.name}</span>
          <span className="hidden rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-slate-600 sm:inline">
            {user.role}
          </span>
        </div>
        <Link
          href="/"
          target="_blank"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
        >
          View website <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>
    </header>
  );
}
