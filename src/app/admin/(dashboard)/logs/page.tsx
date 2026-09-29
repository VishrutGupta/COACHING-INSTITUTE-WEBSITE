import React from "react";
import { redirect } from "next/navigation";
import { getAuthUser, hasPermission } from "@/lib/server/authorization";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { PageHeader } from "@/components/admin/PageHeader";
import { LogsViewer, type LogRow } from "@/components/admin/LogsViewer";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

export default async function AdminLogsPage({ searchParams }: PageProps) {
  const user = await getAuthUser();
  if (!user) redirect("/admin/login");

  if (!hasPermission(user, PERMISSIONS.LOGS_VIEW)) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        You do not have permission to view audit logs.
      </div>
    );
  }

  const params = await searchParams;
  const action = first(params.action);
  const resourceType = first(params.resource_type);
  const page = Math.max(1, Number(first(params.page)) || 1);
  const limit = 25;

  let logs: LogRow[] = [];
  let total = 0;
  const actors: Record<string, { id: string; fullName: string; username: string }> = {};
  let errorMessage = "";

  try {
    const supabase = await createSupabaseServerClient();

    let query = supabase
      .from("audit_logs")
      .select("*", { count: "exact" })
      .eq("institute_id", user.instituteId)
      .order("created_at", { ascending: false });

    if (action) query = query.eq("action", action);
    if (resourceType) query = query.eq("resource_type", resourceType);

    const from = (page - 1) * limit;
    const { data, error, count } = await query.range(from, from + limit - 1);

    if (error) errorMessage = error.message;
    else {
      logs = (data as LogRow[]) || [];
      total = count || 0;
    }

    const userIds = Array.from(
      new Set(logs.map((log) => log.actor_user_id).filter((id): id is string => Boolean(id)))
    );

    if (userIds.length) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, username")
        .in("id", userIds);

      for (const profile of profiles || []) {
        actors[profile.id] = {
          id: profile.id,
          fullName: profile.full_name || "",
          username: profile.username || "",
        };
      }
    }
  } catch {
    errorMessage = "Unable to load audit logs. Run supabase/SEED_DATABASE.sql if tables are missing.";
  }

  return (
    <div>
      <PageHeader
        title="Audit logs"
        description="Every create, update, delete, login and permission change, with field-level diffs."
      />

      {errorMessage && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      <LogsViewer logs={logs} actors={actors} total={total} page={page} limit={limit} />
    </div>
  );
}
