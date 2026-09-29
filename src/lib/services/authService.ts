import { createSupabaseClient } from "@/lib/supabase/client";

export interface SessionUser {
  id: string;
  instituteId: string;
  email: string;
  fullName: string;
  username: string;
  role: string;
}

export const authService = {
  async login(username: string, password: string): Promise<SessionUser> {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Unable to sign in.");
    return data.user as SessionUser;
  },

  async logout(): Promise<void> {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore network errors on logout
    }
    try {
      await createSupabaseClient().auth.signOut();
    } catch {
      // env may be placeholder during local setup
    }
  },

  async forgotPassword(identifier: string): Promise<string> {
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Unable to send the reset link.");
    return data.message || "If that account exists, a reset link has been sent.";
  },

  async resetPassword(password: string, confirmPassword: string): Promise<void> {
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password, confirmPassword }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Unable to update the password.");
  },

  /** Server-side session check used by the admin shell. */
  async getCurrentUser(): Promise<SessionUser | null> {
    try {
      const res = await fetch("/api/auth/session", { cache: "no-store" });
      if (!res.ok) return null;
      const data = await res.json();
      return (data.user as SessionUser) || null;
    } catch {
      return null;
    }
  },
};
