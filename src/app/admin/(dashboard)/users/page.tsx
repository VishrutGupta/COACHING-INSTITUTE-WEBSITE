import React from "react";
import { redirect } from "next/navigation";
import { getAuthUser, hasPermission } from "@/lib/server/authorization";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { PERMISSIONS, ALL_PERMISSIONS } from "@/lib/constants/permissions";
import { PageHeader } from "@/components/admin/PageHeader";
import { UsersManager, type UserRow } from "@/components/admin/UsersManager";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const user = await getAuthUser();
  if (!user) redirect("/admin/login");

  if (!hasPermission(user, PERMISSIONS.USERS_VIEW)) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        You do not have permission to view users.
      </div>
    );
  }

  let rows: UserRow[] = [];
  let errorMessage = "";

  if (!isSupabaseAdminConfigured()) {
    errorMessage =
      "SUPABASE_SERVICE_ROLE_KEY is not configured on the server, so accounts cannot be loaded.";
  } else {
    try {
      const admin = getSupabaseAdmin();

      const [{ data: profiles, error }, { data: permissionRows }] = await Promise.all([
        admin
          .from("profiles")
          .select("id, full_name, username, role, is_disabled, created_at")
          .eq("institute_id", user.instituteId)
          .order("created_at", { ascending: false }),
        admin
          .from("user_permissions")
          .select("user_id, permission")
          .eq("institute_id", user.instituteId),
      ]);

      if (error) errorMessage = error.message;

      const permissionMap = new Map<string, string[]>();
      for (const row of permissionRows || []) {
        const list = permissionMap.get(row.user_id) || [];
        list.push(row.permission);
        permissionMap.set(row.user_id, list);
      }

      rows = (profiles || []).map((profile) => ({
        id: profile.id,
        fullName: profile.full_name || "",
        username: profile.username || "",
        role: profile.role,
        isDisabled: profile.is_disabled,
        createdAt: profile.created_at,
        permissions:
          profile.role === "owner" ? [...ALL_PERMISSIONS] : permissionMap.get(profile.id) || [],
      }));
    } catch (err) {
      errorMessage = err instanceof Error ? err.message : "Unable to load accounts.";
    }
  }

  const isOwner = user.role === "owner";

  return (
    <div>
      <PageHeader
        title="Users"
        description="Admin and staff accounts with granular permissions."
      />

      {errorMessage && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {errorMessage}
        </div>
      )}

      <UsersManager
        rows={rows}
        canCreate={isOwner}
        canEdit={isOwner}
        currentUserId={user.id}
      />
    </div>
  );
}
