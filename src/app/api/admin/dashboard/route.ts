import { NextResponse } from "next/server";
import { requireUser, handleApiError } from "@/lib/server/api";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { loadDashboard } from "@/lib/server/dashboard";

/**
 * GET /api/admin/dashboard — real counts only (no fabricated stats).
 * Every count is gated by the caller's own permissions.
 */
export async function GET() {
  try {
    const user = await requireUser(PERMISSIONS.DASHBOARD_VIEW);
    const { counts, recent } = await loadDashboard(user);

    return NextResponse.json({
      counts,
      recentActivity: recent,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
