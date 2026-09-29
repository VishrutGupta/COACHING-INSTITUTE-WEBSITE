import type { SupabaseClient } from "@supabase/supabase-js";

export interface AuditLogParams {
  supabase: SupabaseClient;
  instituteId: string;
  actorUserId: string;
  actorUsername: string;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  description: string;
  beforeData?: Record<string, unknown> | null;
  afterData?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
}

const SENSITIVE_KEYS = [
  "password",
  "new_password",
  "current_password",
  "token",
  "access_token",
  "refresh_token",
  "service_role",
  "service_role_key",
  "secret",
  "api_key",
  "apikey",
  "authorization",
  "cookie",
];

function isSensitive(key: string): boolean {
  const lowered = key.toLowerCase();
  return SENSITIVE_KEYS.some((sensitive) => lowered.includes(sensitive));
}

/** Deep-copies data while stripping anything that could hold a secret. */
export function sanitizeAuditData(
  data: Record<string, unknown> | null | undefined
): Record<string, unknown> | null {
  if (!data) return null;
  const output: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (isSensitive(key)) continue;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      output[key] = sanitizeAuditData(value as Record<string, unknown>);
    } else {
      output[key] = value;
    }
  }
  return output;
}

/**
 * Writes exactly ONE audit row for exactly ONE successful operation.
 * Never logs passwords, tokens, cookies, secrets or the service role key.
 */
export async function auditLog(params: AuditLogParams): Promise<boolean> {
  const {
    supabase,
    instituteId,
    actorUserId,
    actorUsername,
    action,
    resourceType,
    resourceId,
    description,
    beforeData,
    afterData,
    metadata,
  } = params;

  const { error } = await supabase.from("audit_logs").insert({
    institute_id: instituteId,
    actor_user_id: actorUserId,
    actor_username: actorUsername,
    action,
    resource_type: resourceType,
    resource_id: resourceId ?? null,
    description,
    before_data: sanitizeAuditData(beforeData),
    after_data: sanitizeAuditData(afterData),
    metadata: sanitizeAuditData(metadata),
  });

  if (error) {
    console.error("[audit] insert failed:", {
      action,
      resourceType,
      resourceId,
      code: error.code,
      message: error.message,
    });
    return false;
  }

  return true;
}
