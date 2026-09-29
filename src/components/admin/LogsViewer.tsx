"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Field";
import { diffSnapshots, displayValue, fieldLabel, type AuditChange } from "@/lib/utils/auditDiff";

export interface LogRow {
  id: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  description: string;
  before_data: Record<string, unknown> | null;
  after_data: Record<string, unknown> | null;
  created_at: string;
  actor_user_id: string | null;
  actor_username: string;
}

interface Actor {
  id: string;
  fullName: string;
  username: string;
}

interface Props {
  logs: LogRow[];
  actors: Record<string, Actor>;
  total: number;
  page: number;
  limit: number;
}

const ACTIONS = [
  "",
  "LOGIN",
  "OWNER_BOOTSTRAP",
  "PASSWORD_RESET",
  "COURSE_CREATE",
  "COURSE_UPDATE",
  "COURSE_DELETE",
  "FACULTY_CREATE",
  "FACULTY_UPDATE",
  "FACULTY_DELETE",
  "SUBJECT_CREATE",
  "SUBJECT_UPDATE",
  "SUBJECT_DELETE",
  "SETTINGS_UPDATE",
  "USER_CREATE",
  "USER_UPDATE",
  "USER_DELETE",
];

const ENTITY_TYPES = [
  "",
  "Course",
  "Faculty",
  "Subject",
  "Settings",
  "User",
  "UserPermission",
  "CourseFaculty",
  "Auth",
];

export function LogsViewer({ logs, actors, total, page, limit }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selected, setSelected] = useState<LogRow | null>(null);
  const [action, setAction] = useState(searchParams.get("action") || "");
  const [entityType, setEntityType] = useState(searchParams.get("resource_type") || "");

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const applyFilters = (nextAction: string, nextEntity: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (nextAction) params.set("action", nextAction);
    else params.delete("action");
    if (nextEntity) params.set("resource_type", nextEntity);
    else params.delete("resource_type");
    params.delete("page");
    router.push(`/admin/logs?${params.toString()}`);
  };

  const goToPage = (target: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(target));
    router.push(`/admin/logs?${params.toString()}`);
  };

  const changes: AuditChange[] = selected
    ? diffSnapshots(selected.before_data, selected.after_data)
    : [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="log-action" className="mb-1 block text-xs font-medium text-slate-500">
            Action
          </label>
          <Select
            id="log-action"
            value={action}
            onChange={(event) => {
              setAction(event.target.value);
              applyFilters(event.target.value, entityType);
            }}
          >
            {ACTIONS.map((value) => (
              <option key={value} value={value}>
                {value || "All actions"}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label htmlFor="log-entity" className="mb-1 block text-xs font-medium text-slate-500">
            Resource
          </label>
          <Select
            id="log-entity"
            value={entityType}
            onChange={(event) => {
              setEntityType(event.target.value);
              applyFilters(action, event.target.value);
            }}
          >
            {ENTITY_TYPES.map((value) => (
              <option key={value} value={value}>
                {value || "All resources"}
              </option>
            ))}
          </Select>
        </div>
        <p className="ml-auto text-xs text-slate-500">
          {total} record{total === 1 ? "" : "s"}
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">When</th>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Resource</th>
                <th className="px-4 py-3 font-medium">Changes</th>
                <th className="px-4 py-3 font-medium">Diff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    No audit records found.
                  </td>
                </tr>
              )}
              {logs.map((log) => {
                const actor =
                  (log.actor_user_id ? actors[log.actor_user_id] : undefined) ||
                  (log.actor_username
                    ? { username: log.actor_username }
                    : undefined);
                const changeCount = diffSnapshots(log.before_data, log.after_data).length;
                return (
                  <tr key={log.id}>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      {actor ? actor.username : "system"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      {log.resource_type}
                      {log.resource_id ? (
                        <span className="text-xs text-slate-400"> · {log.resource_id.slice(0, 8)}</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {changeCount ? `${changeCount} field${changeCount === 1 ? "" : "s"}` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setSelected(log)}
                        className="rounded p-1.5 text-slate-500 hover:bg-slate-100"
                        aria-label="View diff"
                        title="View changes"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">
          Page {page} of {totalPages}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => goToPage(page - 1)}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => goToPage(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto px-4 py-10">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSelected(null)}
            aria-hidden
          />
          <div className="relative w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  {fieldLabel(selected.resource_type)} — {selected.action}
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  {new Date(selected.created_at).toLocaleString()}
                </p>
                {selected.description && (
                  <p className="mt-2 text-sm text-slate-600">{selected.description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded p-1.5 text-slate-500 hover:bg-slate-100"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 max-h-[55vh] space-y-3 overflow-y-auto">
              {changes.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No field-level changes recorded for this entry.
                </p>
              ) : (
                changes.map((change) => (
                  <div key={change.field} className="rounded-lg border border-slate-200 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {fieldLabel(change.field)}
                    </p>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      <div className="rounded bg-red-50 px-3 py-2">
                        <p className="text-[11px] font-medium text-red-500">Old</p>
                        <p className="break-words text-sm text-red-700">
                          {displayValue(change.before)}
                        </p>
                      </div>
                      <div className="rounded bg-emerald-50 px-3 py-2">
                        <p className="text-[11px] font-medium text-emerald-600">New</p>
                        <p className="break-words text-sm text-emerald-700">
                          {displayValue(change.after)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
