"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen,
  GraduationCap,
  LayoutDashboard,
  Layers,
  LogOut,
  Menu,
  ScrollText,
  Settings,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { authService } from "@/lib/services/authService";
import { PERMISSIONS } from "@/lib/constants/permissions";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  permission: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard, permission: PERMISSIONS.DASHBOARD_VIEW },
  { label: "Courses", href: "/admin/courses", icon: BookOpen, permission: PERMISSIONS.COURSES_VIEW },
  { label: "Faculty", href: "/admin/faculty", icon: GraduationCap, permission: PERMISSIONS.FACULTY_VIEW },
  { label: "Subjects", href: "/admin/subjects", icon: Layers, permission: PERMISSIONS.SUBJECTS_VIEW },
  { label: "Users", href: "/admin/users", icon: Users, permission: PERMISSIONS.USERS_VIEW },
  { label: "Audit Logs", href: "/admin/logs", icon: ScrollText, permission: PERMISSIONS.LOGS_VIEW },
  { label: "Settings", href: "/admin/settings", icon: Settings, permission: PERMISSIONS.SETTINGS_VIEW },
];

interface Props {
  user: { name: string; role: string };
}

export function AdminSidebar({ user }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [role, setRole] = useState(user.role);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/session", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data?.user) {
          if (!cancelled) setLoaded(true);
          return;
        }
        setRole(data.user.role);
        setPermissions(data.user.permissions || []);
        setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const isOwner = role === "owner";
  const visibleItems = !loaded
    ? []
    : NAV_ITEMS.filter((item) => isOwner || permissions.includes(item.permission));

  const handleLogout = async () => {
    await authService.logout();
    router.replace("/admin/login");
    router.refresh();
  };

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  const content = (
    <div className="flex h-full flex-col bg-slate-900 text-white">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <Link href="/admin" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-900">
            <GraduationCap className="h-4 w-4" />
          </span>
          <span className="text-sm font-semibold">Institute Admin</span>
        </Link>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-md p-1 text-slate-400 hover:text-white lg:hidden"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                isActive(item.href)
                  ? "bg-white/10 font-medium text-white"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 px-5 py-4">
        <p className="truncate text-sm font-medium text-white">{user.name}</p>
        <p className="text-xs uppercase tracking-wide text-slate-400">{role}</p>
        <button
          type="button"
          onClick={handleLogout}
          className="mt-3 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 left-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:block">{content}</aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw]">{content}</div>
        </div>
      )}
    </>
  );
}
