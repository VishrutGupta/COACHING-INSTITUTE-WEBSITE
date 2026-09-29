import { NextRequest, NextResponse } from "next/server";
import { requireUser, handleApiError, jsonError, ApiError } from "@/lib/server/api";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { auditLog } from "@/lib/server/auditLog";
import { diffSnapshots } from "@/lib/utils/auditDiff";
import type { AuthUser } from "@/lib/server/authorization";

export type AnySupabase = Awaited<ReturnType<typeof createSupabaseServerClient>>;

const TECHNICAL_FIELDS = ["id", "institute_id", "created_at", "updated_at"];

const FOREIGN_KEY_NAMES: { column: string; table: string; labelColumn: string }[] = [
  { column: "course_id", table: "courses", labelColumn: "title" },
  { column: "faculty_id", table: "faculty", labelColumn: "name" },
  { column: "branch_id", table: "branches", labelColumn: "name" },
  { column: "batch_id", table: "batches", labelColumn: "name" },
  { column: "subject_id", table: "subjects", labelColumn: "name" },
  { column: "album_id", table: "gallery_albums", labelColumn: "title" },
  { column: "assigned_to", table: "profiles", labelColumn: "username" },
];

/** Replaces foreign-key ids with the related record's human readable name. */
export async function readableSnapshot(
  supabase: AnySupabase,
  row: Record<string, unknown> | null | undefined
): Promise<Record<string, unknown> | null> {
  if (!row) return null;

  const output: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    if (TECHNICAL_FIELDS.includes(key)) continue;
    if (key.endsWith("_id") || key === "assigned_to") continue;
    output[key] = value;
  }

  for (const fk of FOREIGN_KEY_NAMES) {
    if (!(fk.column in row)) continue;
    const raw = row[fk.column];
    const key = fk.column === "assigned_to" ? "assigned_to" : fk.column.replace(/_id$/, "");
    if (!raw) {
      output[key] = "";
      continue;
    }
    try {
      const { data } = await supabase
        .from(fk.table)
        .select(fk.labelColumn)
        .eq("id", raw as string)
        .maybeSingle();
      output[key] = data
        ? String((data as unknown as Record<string, unknown>)[fk.labelColumn] ?? "")
        : "";
    } catch {
      output[key] = String(raw);
    }
  }

  return output;
}

export interface CrudContext {
  supabase: AnySupabase;
  user: AuthUser;
  body: Record<string, unknown>;
  /** Existing row (only set for updates). */
  before?: Record<string, unknown>;
}

export interface CrudConfig {
  table: string;
  permissions: { view: string; create: string; edit: string; delete: string };
  /** Human resource name used in audit rows, e.g. "Batch". */
  resourceType: string;
  /** Dotted audit action prefix, e.g. "batch" -> batch.create. */
  auditPrefix: string;
  select: string;
  order?: { column: string; ascending?: boolean }[];
  searchColumns?: string[];
  /** Row label used in audit descriptions. */
  label: (row: Record<string, unknown>) => string;
  buildInsert: (
    ctx: CrudContext
  ) => Promise<Record<string, unknown>> | Record<string, unknown>;
  buildUpdate?: (
    ctx: CrudContext
  ) => Promise<Record<string, unknown>> | Record<string, unknown>;
  /** Declarative equality filters for GET (?param=value). */
  filters?: {
    column: string;
    param: string;
    /** Fixed value ignores the query string. */
    value?: string;
    map?: (raw: string) => unknown;
  }[];
  hooks?: {
    afterInsert?: (
      ctx: CrudContext & { row: Record<string, unknown> }
    ) => Promise<void> | void;
    afterUpdate?: (
      ctx: CrudContext & { before: Record<string, unknown>; row: Record<string, unknown> }
    ) => Promise<void> | void;
    afterDelete?: (ctx: CrudContext & { before: Record<string, unknown> }) => Promise<
      void
    >;
  };
  /** Merges extra human readable fields (e.g. linked records) into audit snapshots. */
  augmentSnapshot?: (ctx: {
    supabase: AnySupabase;
    row: Record<string, unknown>;
    snapshot: Record<string, unknown> | null;
  }) => Promise<Record<string, unknown>> | Record<string, unknown>;
}

const DEFAULT_ORDER = [{ column: "display_order", ascending: true }];

export function createListHandler(config: CrudConfig) {
  return async function GET(request: NextRequest) {
    try {
      const user = await requireUser(config.permissions.view);
      const supabase = await createSupabaseServerClient();
      const { searchParams } = request.nextUrl;

      const page = Math.max(1, Number(searchParams.get("page")) || 1);
      const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 50));
      const search = (searchParams.get("search") || "").trim();

      let query = supabase
        .from(config.table)
        .select(config.select, { count: "exact" })
        .eq("institute_id", user.instituteId);

      if (config.filters) {
        for (const rule of config.filters) {
          const raw = rule.value !== undefined ? rule.value : searchParams.get(rule.param);
          if (raw === null || raw === "") continue;
          query = query.eq(rule.column, rule.map ? rule.map(raw) : raw);
        }
      }

      if (search && config.searchColumns?.length) {
        const clause = config.searchColumns
          .map((column) => `${column}.ilike.%${search}%`)
          .join(",");
        query = query.or(clause);
      }

      const order = config.order || DEFAULT_ORDER;
      for (const rule of order) {
        query = query.order(rule.column, { ascending: rule.ascending ?? true });
      }
      query = query.order("created_at", { ascending: false });

      const from = (page - 1) * limit;
      const { data, error, count } = await query.range(from, from + limit - 1);
      if (error) return jsonError(error.message, 500);

      return NextResponse.json({
        rows: data || [],
        total: count || 0,
        page,
        limit,
      });
    } catch (error) {
      return handleApiError(error);
    }
  };
}

export function createCreateHandler(config: CrudConfig) {
  return async function POST(request: NextRequest) {
    try {
      const user = await requireUser(config.permissions.create);
      const supabase = await createSupabaseServerClient();
      const body = await request.json().catch(() => ({}));

      const payload = await config.buildInsert({ supabase, user, body });
      payload.institute_id = user.instituteId;

      const { data, error } = await supabase
        .from(config.table)
        .insert(payload)
        .select(config.select)
        .single();
      if (error) return jsonError(error.message, 500);

      const row = data as unknown as Record<string, unknown>;

      await config.hooks?.afterInsert?.({ supabase, user, body, row });

      let afterSnapshot = await readableSnapshot(supabase, row);
      if (config.augmentSnapshot) {
        afterSnapshot = await config.augmentSnapshot({ supabase, row, snapshot: afterSnapshot });
      }

      await auditLog({
        supabase,
        instituteId: user.instituteId,
        actorUserId: user.id,
        actorUsername: user.username,
        action: `${config.auditPrefix}.create`,
        resourceType: config.resourceType,
        resourceId: String(row.id),
        description: `Created ${config.resourceType.toLowerCase()} "${config.label(row)}"`,
        beforeData: null,
        afterData: afterSnapshot,
      });

      return NextResponse.json({ [config.table]: row, row }, { status: 201 });
    } catch (error) {
      return handleApiError(error);
    }
  };
}

export function createUpdateHandler(config: CrudConfig) {
  return async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
      const user = await requireUser(config.permissions.edit);
      const supabase = await createSupabaseServerClient();
      const { id } = await params;
      const body = await request.json().catch(() => ({}));

      const { data: beforeRow, error: beforeError } = await supabase
        .from(config.table)
        .select("*")
        .eq("institute_id", user.instituteId)
        .eq("id", id)
        .maybeSingle();
      if (beforeError) return jsonError(beforeError.message, 500);
      if (!beforeRow) return jsonError(`${config.resourceType} not found.`, 404);

      const before = beforeRow as unknown as Record<string, unknown>;
      const payload = config.buildUpdate
        ? await config.buildUpdate({ supabase, user, body, before })
        : {};
      if (Object.keys(payload).length === 0) {
        return jsonError("No updatable fields supplied.", 400);
      }

      let beforeSnapshot = await readableSnapshot(supabase, before);
      if (config.augmentSnapshot) {
        beforeSnapshot = await config.augmentSnapshot({ supabase, row: before, snapshot: beforeSnapshot });
      }

      const { data, error } = await supabase
        .from(config.table)
        .update(payload)
        .eq("institute_id", user.instituteId)
        .eq("id", id)
        .select(config.select)
        .single();
      if (error) return jsonError(error.message, 500);

      const row = data as unknown as Record<string, unknown>;

      await config.hooks?.afterUpdate?.({ supabase, user, body, before, row });

      let afterSnapshot = await readableSnapshot(supabase, row);
      if (config.augmentSnapshot) {
        afterSnapshot = await config.augmentSnapshot({ supabase, row, snapshot: afterSnapshot });
      }

      const changes = diffSnapshots(beforeSnapshot, afterSnapshot);

      if (changes.length > 0) {
        await auditLog({
          supabase,
          instituteId: user.instituteId,
          actorUserId: user.id,
          actorUsername: user.username,
          action: `${config.auditPrefix}.update`,
          resourceType: config.resourceType,
          resourceId: String(row.id),
          description: `Updated ${config.resourceType.toLowerCase()} "${config.label(row)}" (${changes.length} field${
            changes.length === 1 ? "" : "s"
          })`,
          beforeData: Object.fromEntries(changes.map((change) => [change.field, change.before])),
          afterData: Object.fromEntries(changes.map((change) => [change.field, change.after])),
        });
      }

      return NextResponse.json({ row, changed: changes.length });
    } catch (error) {
      return handleApiError(error);
    }
  };
}

export function createDeleteHandler(config: CrudConfig) {
  return async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) {
    try {
      const user = await requireUser(config.permissions.delete);
      const supabase = await createSupabaseServerClient();
      const { id } = await params;

      const { data: beforeRow, error: beforeError } = await supabase
        .from(config.table)
        .select("*")
        .eq("institute_id", user.instituteId)
        .eq("id", id)
        .maybeSingle();
      if (beforeError) return jsonError(beforeError.message, 500);
      if (!beforeRow) return jsonError(`${config.resourceType} not found.`, 404);

      const before = beforeRow as unknown as Record<string, unknown>;

      let beforeSnapshot = await readableSnapshot(supabase, before);
      if (config.augmentSnapshot) {
        beforeSnapshot = await config.augmentSnapshot({ supabase, row: before, snapshot: beforeSnapshot });
      }

      const { error } = await supabase
        .from(config.table)
        .delete()
        .eq("institute_id", user.instituteId)
        .eq("id", id);
      if (error) return jsonError(error.message, 500);

      await config.hooks?.afterDelete?.({ supabase, user, body: {}, before });

      await auditLog({
        supabase,
        instituteId: user.instituteId,
        actorUserId: user.id,
        actorUsername: user.username,
        action: `${config.auditPrefix}.delete`,
        resourceType: config.resourceType,
        resourceId: id,
        description: `Deleted ${config.resourceType.toLowerCase()} "${config.label(before)}"`,
        beforeData: beforeSnapshot,
        afterData: null,
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      return handleApiError(error);
    }
  };
}

/** Shared field mappers used by Part 2 resource configs. */
export const fields = {
  text: (value: unknown, fallback = "") => String(value ?? fallback).trim(),
  raw: (value: unknown, fallback = "") => String(value ?? fallback),
  int: (value: unknown, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.trunc(parsed) : fallback;
  },
  bool: (value: unknown, fallback = false) => {
    if (value === undefined || value === null || value === "") return fallback;
    if (typeof value === "string") {
      const lower = value.toLowerCase();
      if (lower === "false" || lower === "0" || lower === "no") return false;
      if (lower === "true" || lower === "1" || lower === "yes") return true;
      return fallback;
    }
    return Boolean(value);
  },
  nullableDate: (value: unknown) => (value ? String(value) : null),
  list: (value: unknown): string[] =>
    Array.isArray(value) ? value.map((item) => String(item)).filter(Boolean) : [],
  oneOf: <T extends string>(value: unknown, allowed: T[], fallback: T): T =>
    allowed.includes(value as T) ? (value as T) : fallback,
};

export { ApiError };
