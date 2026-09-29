import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/server/authorization";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";

/**
 * Server-side guard for every /admin page except the auth pages.
 * Role and permissions are resolved from the authenticated session only —
 * nothing supplied by the browser is trusted.
 */
export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthUser();

  if (!user) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <AdminSidebar user={{ name: user.fullName || user.username, role: user.role }} />
      <div className="lg:pl-64">
        <AdminHeader
          user={{
            name: user.fullName || user.username,
            username: user.username,
            role: user.role,
          }}
        />
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
