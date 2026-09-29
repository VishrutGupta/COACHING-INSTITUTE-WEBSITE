import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AuthUser, Role } from "@/lib/types";
import { PERMISSIONS } from "@/lib/constants/permissions";

export type { AuthUser };

/**
 * Resolves the authenticated user from the Supabase auth session cookie and
 * hydrates role + permissions from the database.
 *
 * ALWAYS call this on the server. Never trust role, institute id or
 * permissions submitted by the browser.
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  let supabase;
  try {
    supabase = await createSupabaseServerClient();
  } catch {
    return null;
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return null;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, institute_id, full_name, role, username, is_disabled")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) return null;
  if (profile.is_disabled) return null;

  const role = profile.role as Role;
  if (role !== "owner" && role !== "admin" && role !== "staff") return null;

  let permissions: string[] = [];
  if (role !== "owner") {
    const { data: perms } = await supabase
      .from("user_permissions")
      .select("permission")
      .eq("user_id", user.id);
    permissions = (perms || []).map((row) => row.permission as string);
  }

  return {
    id: profile.id,
    email: user.email || "",
    username: profile.username || "",
    fullName: profile.full_name || "",
    role,
    instituteId: profile.institute_id,
    isDisabled: profile.is_disabled,
    permissions,
  };
}

/** OWNER bypasses every permission check. ADMIN/STAFF use user_permissions. */
export function hasPermission(user: AuthUser, permission: string): boolean {
  if (user.role === "owner") return true;
  return user.permissions.includes(permission);
}

export function requirePermission(
  user: AuthUser,
  permission: string
): { allowed: boolean; error?: string } {
  if (!hasPermission(user, permission)) {
    return { allowed: false, error: `Permission denied: ${permission}` };
  }
  return { allowed: true };
}

export function isOwner(user: AuthUser): boolean {
  return user.role === "owner";
}

export const NAV_PERMISSIONS = {
  dashboard: PERMISSIONS.DASHBOARD_VIEW,
  courses: PERMISSIONS.COURSES_VIEW,
  faculty: PERMISSIONS.FACULTY_VIEW,
  subjects: PERMISSIONS.SUBJECTS_VIEW,
  settings: PERMISSIONS.SETTINGS_VIEW,
  users: PERMISSIONS.USERS_VIEW,
  logs: PERMISSIONS.LOGS_VIEW,
} as const;
