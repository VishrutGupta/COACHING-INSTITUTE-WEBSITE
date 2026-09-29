"use client";

import React, { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Mail, Phone, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select, Textarea, Input } from "@/components/ui/Field";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { ENQUIRY_STATUSES, ENQUIRY_STATUS_LABELS, type EnquiryStatus } from "@/lib/types";
import { notifyCrudChange, type Row } from "@/components/admin/CrudTable";

interface Option {
  value: string;
  label: string;
}

interface Props {
  canEdit: boolean;
  canDelete: boolean;
  users: Option[];
  courses: Option[];
}

const SOURCES: Option[] = [
  { value: "contact", label: "Contact form" },
  { value: "course", label: "Course page" },
  { value: "apply", label: "Apply form" },
  { value: "callback", label: "Callback request" },
];

const STATUS_TONES: Record<string, string> = {
  new: "bg-blue-100 text-blue-700",
  contacted: "bg-slate-100 text-slate-700",
  follow_up: "bg-amber-100 text-amber-700",
  interested: "bg-violet-100 text-violet-700",
  converted: "bg-emerald-100 text-emerald-700",
  closed: "bg-red-100 text-red-700",
};

function labelFor(list: Option[], id: unknown): string {
  if (!id) return "—";
  return list.find((option) => option.value === String(id))?.label || "—";
}

export function EnquiriesManager({ canEdit, canDelete, users, courses }: Props) {
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("");
  const [source, setSource] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [expanded, setExpanded] = useState("");
  const [notesDraft, setNotesDraft] = useState("");
  const [confirmId, setConfirmId] = useState("");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedSearch((current) => (current === search ? current : search));
      setPage((current) => (current === 1 ? current : 1));
    }, 300);
    return () => window.clearTimeout(handle);
  }, [search]);

  useEffect(() => {
    const onChanged = () => setTick((value) => value + 1);
    window.addEventListener("crud:changed", onChanged);
    return () => window.removeEventListener("crud:changed", onChanged);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("limit", String(limit));
        if (debouncedSearch) params.set("search", debouncedSearch);
        if (status) params.set("status", status);
        if (source) params.set("source", source);
        if (assignedTo) params.set("assigned_to", assignedTo);

        const res = await fetch(`/api/admin/enquiries?${params.toString()}`, {
          signal: controller.signal,
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Unable to load enquiries.");
        setRows(Array.isArray(data.rows) ? data.rows : []);
        setTotal(Number(data.total) || 0);
        setError("");
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Unable to load enquiries.");
        setRows([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    void load();
    return () => controller.abort();
  }, [page, limit, debouncedSearch, status, source, assignedTo, tick]);

  const patch = async (id: string, payload: Record<string, unknown>) => {
    if (busyId) return;
    setBusyId(id);
    setError("");
    try {
      const res = await fetch(`/api/admin/enquiries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Unable to update the enquiry.");
      notifyCrudChange();
      setTick((value) => value + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update the enquiry.");
    } finally {
      setBusyId("");
    }
  };

  const remove = async (id: string) => {
    if (busyId) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/enquiries/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Unable to delete the enquiry.");
      setConfirmId("");
      setTick((value) => value + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete the enquiry.");
      setConfirmId("");
    } finally {
      setBusyId("");
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <div className="relative lg:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, phone, email…"
            className="pl-9"
            aria-label="Search enquiries"
          />
        </div>

        <div className="lg:w-44">
          <label htmlFor="enquiry-status" className="mb-1 block text-xs font-medium text-slate-500">
            Status
          </label>
          <Select
            id="enquiry-status"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All statuses</option>
            {ENQUIRY_STATUSES.map((value) => (
              <option key={value} value={value}>
                {ENQUIRY_STATUS_LABELS[value]}
              </option>
            ))}
          </Select>
        </div>

        <div className="lg:w-44">
          <label htmlFor="enquiry-source" className="mb-1 block text-xs font-medium text-slate-500">
            Source
          </label>
          <Select
            id="enquiry-source"
            value={source}
            onChange={(event) => {
              setSource(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All sources</option>
            {SOURCES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>

        {users.length > 0 && (
          <div className="lg:w-56">
            <label htmlFor="enquiry-assigned" className="mb-1 block text-xs font-medium text-slate-500">
              Assigned to
            </label>
            <Select
              id="enquiry-assigned"
              value={assignedTo}
              onChange={(event) => {
                setAssignedTo(event.target.value);
                setPage(1);
              }}
            >
              <option value="">Anyone</option>
              {users.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
        )}

        <p className="ml-auto text-xs text-slate-500">
          {total} lead{total === 1 ? "" : "s"}
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((index) => (
            <div key={index} className="h-20 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <p className="text-sm text-slate-600">No enquiries match these filters.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => {
            const id = String(row.id);
            const isOpen = expanded === id;
            const rowStatus = String(row.status || "new") as EnquiryStatus;

            return (
              <div key={id} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-slate-900">{String(row.name || "—")}</p>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_TONES[rowStatus] || "bg-slate-100 text-slate-700"}`}
                      >
                        {ENQUIRY_STATUS_LABELS[rowStatus] || rowStatus}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600">
                        {SOURCES.find((item) => item.value === String(row.source))?.label || String(row.source || "")}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      {row.phone ? (
                        <a href={`tel:${String(row.phone)}`} className="inline-flex items-center gap-1 hover:text-slate-900">
                          <Phone className="h-3.5 w-3.5" /> {String(row.phone)}
                        </a>
                      ) : null}
                      {row.email ? (
                        <a href={`mailto:${String(row.email)}`} className="inline-flex items-center gap-1 hover:text-slate-900">
                          <Mail className="h-3.5 w-3.5" /> {String(row.email)}
                        </a>
                      ) : null}
                      <span>Course: {labelFor(courses, row.course_id)}</span>
                      <span>
                        {new Date(String(row.created_at)).toLocaleString()}
                      </span>
                    </div>

                    <p className="mt-2 line-clamp-2 text-sm text-slate-600">{String(row.message || "")}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {canEdit && (
                      <>
                        <Select
                          value={rowStatus}
                          disabled={busyId === id}
                          onChange={(event) => patch(id, { status: event.target.value })}
                          className="h-9 w-40"
                          aria-label="Change status"
                        >
                          {ENQUIRY_STATUSES.map((value) => (
                            <option key={value} value={value}>
                              {ENQUIRY_STATUS_LABELS[value]}
                            </option>
                          ))}
                        </Select>

                        {users.length > 0 && (
                          <Select
                            value={String(row.assigned_to || "")}
                            disabled={busyId === id}
                            onChange={(event) =>
                              patch(id, { assigned_to: event.target.value || null })
                            }
                            className="h-9 w-44"
                            aria-label="Assign"
                          >
                            <option value="">Unassigned</option>
                            {users.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </Select>
                        )}
                      </>
                    )}

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setExpanded(isOpen ? "" : id);
                        setNotesDraft(String(row.notes || ""));
                      }}
                    >
                      {isOpen ? "Close" : "Details"}
                    </Button>

                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => setConfirmId(id)}
                        className="rounded-md p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600"
                        aria-label="Delete enquiry"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {isOpen && (
                  <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          Preferred batch
                        </p>
                        <p className="text-sm text-slate-700">
                          {String(row.preferred_batch || "—")}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          Assigned to
                        </p>
                        <p className="text-sm text-slate-700">
                          {labelFor(users, row.assigned_to)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          Received
                        </p>
                        <p className="text-sm text-slate-700">
                          {new Date(String(row.created_at)).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div>
                      <label htmlFor={`notes-${id}`} className="mb-1.5 block text-sm font-medium text-slate-700">
                        Internal notes
                      </label>
                      <Textarea
                        id={`notes-${id}`}
                        rows={3}
                        value={notesDraft}
                        disabled={!canEdit || busyId === id}
                        onChange={(event) => setNotesDraft(event.target.value)}
                        placeholder="Follow-up call on Friday, asked for fee structure…"
                      />
                      <div className="mt-2">
                        <Button
                          type="button"
                          size="sm"
                          loading={busyId === id}
                          disabled={!canEdit}
                          onClick={() => patch(id, { notes: notesDraft })}
                        >
                          Save notes
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-500">
          {loading ? "Loading…" : `Page ${page} of ${totalPages}`}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || loading}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
          >
            Next <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(confirmId)}
        title="Delete enquiry?"
        message="This lead and its notes will be permanently removed."
        loading={Boolean(busyId)}
        onConfirm={() => remove(confirmId)}
        onCancel={() => setConfirmId("")}
      />
    </div>
  );
}
