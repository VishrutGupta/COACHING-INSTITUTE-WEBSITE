import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/server/authorization";

/** GET /api/auth/session — returns the current server-side session (or null). */
export async function GET() {
  const user = await getAuthUser();

  if (!user) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      instituteId: user.instituteId,
      email: user.email,
      fullName: user.fullName,
      username: user.username,
      role: user.role,
      permissions: user.permissions,
    },
  });
}
