import { NextResponse } from "next/server";
import { getAuthUser, hasPermission, type AuthUser } from "@/lib/server/authorization";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/**
 * Server-side authorization for API routes.
 * Never trusts browser-submitted role, institute id or permissions.
 */
export async function requireUser(permission?: string): Promise<AuthUser> {
  const user = await getAuthUser();
  if (!user) throw new ApiError(401, "Unauthorized");
  if (permission && !hasPermission(user, permission)) {
    throw new ApiError(403, `Permission denied: ${permission}`);
  }
  return user;
}

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  const message = error instanceof Error ? error.message : "Unexpected server error.";
  console.error("[api] unhandled error:", message);
  return NextResponse.json({ error: message }, { status: 500 });
}

export function jsonError(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}
