import { NextRequest, NextResponse } from "next/server";
import { requireUser, handleApiError, jsonError } from "@/lib/server/api";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PERMISSIONS } from "@/lib/constants/permissions";

/**
 * GET /api/admin/logs — paginated audit trail for the caller's institute.
 * Query: ?page=1&limit=25&action=&resource_type=&search=
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(PERMISSIONS.LOGS_VIEW);
    const supabase = await createSupabaseServerClient();

    const { searchParams } = request.nextUrl;
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 25));
    const action = searchParams.get("action");
    const resourceType = searchParams.get("resource_type");

    let query = supabase
      .from("audit_logs")
      .select("*", { count: "exact" })
      .eq("institute_id", user.instituteId)
      .order("created_at", { ascending: false });

    if (action) query = query.eq("action", action);
    if (resourceType) query = query.eq("resource_type", resourceType);

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;
    if (error) return jsonError(error.message, 500);

    return NextResponse.json({
      logs: data || [],
      total: count || 0,
      page,
      limit,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
