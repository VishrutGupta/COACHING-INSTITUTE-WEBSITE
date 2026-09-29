"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";
import { Input, Select } from "@/components/ui/Field";

export type Row = Record<string, unknown>;

export interface CrudColumn {
  key: string;
  header: string;
  className?: string;
  render?: (row: Row) => React.ReactNode;
}

export interface CrudFilter {
  name: string;
  label: string;
  options: { value: string; label: string }[];
}

interface Props {
  endpoint: string;
  columns: CrudColumn[];
  filters?: CrudFilter[];
  searchPlaceholder?: string;
  emptyMessage: string;
  emptyHint?: string;
  createHref?: string;
  createLabel?: string;
  actions?: (row: Row) => React.ReactNode;
  limit?: number;
}

/** Signals every list on the page that a mutation finished. */
export function notifyCrudChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("crud:changed"));
  }
}

function cell(row: Row, column: CrudColumn): React.ReactNode {
  if (column.render) return column.render(row);
  const value = row[column.key];
  if (value === null || value === undefined || value === "") return "—";
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}

/**
 * Server-side searched, filtered and paginated list.
 * Loading, empty, error, pagination and confirmation states are built in.
 */
export function CrudTable({
  endpoint,
  columns,
  filters = [],
  searchPlaceholder = "Search…",
  emptyMessage,
  emptyHint,
  createHref,
  createLabel,
  actions,
  limit = 20,
}: Props) {
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);

  const filterKey = useMemo(
    () => filters.map((filter) => `${filter.name}=${filterValues[filter.name] || ""}`).join("&"),
    [filters, filterValues]
  );

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
        for (const [key, value] of Object.entries(filterValues)) {
          if (value) params.set(key, value);
        }

        const res = await fetch(`${endpoint}?${params.toString()}`, {
          signal: controller.signal,
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Unable to load records.");
        setRows(Array.isArray(data.rows) ? data.rows : []);
        setTotal(Number(data.total) || 0);
        setError("");
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Unable to load records.");
        setRows([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    void load();

    return () => controller.abort();
  }, [endpoint, page, limit, debouncedSearch, filterKey, filterValues, tick]);

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(total, page * limit);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <div className="relative lg:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={searchPlaceholder}
            className="pl-9"
            aria-label="Search"
          />
        </div>

        {filters.map((filter) => (
          <div key={filter.name} className="lg:w-48">
            <label
              htmlFor={`filter-${filter.name}`}
              className="mb-1 block text-xs font-medium text-slate-500"
            >
              {filter.label}
            </label>
            <Select
              id={`filter-${filter.name}`}
              value={filterValues[filter.name] || ""}
              onChange={(event) => {
                setFilterValues((prev) => ({ ...prev, [filter.name]: event.target.value }));
                setPage(1);
              }}
            >
              <option value="">All {filter.label.toLowerCase()}</option>
              {filter.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
        ))}

        <div className="flex items-center justify-between gap-3 lg:ml-auto">
          <p className="text-xs text-slate-500">
            {total} record{total === 1 ? "" : "s"}
          </p>
          {createHref && (
            <Link
              href={createHref}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" /> {createLabel || "New"}
            </Link>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                {columns.map((column) => (
                  <th key={column.key} className={`px-4 py-3 font-medium ${column.className || ""}`}>
                    {column.header}
                  </th>
                ))}
                {actions && <th className="px-4 py-3 font-medium">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr>
                  <td colSpan={columns.length + (actions ? 1 : 0)} className="px-4 py-8">
                    <div className="space-y-2">
                      {[0, 1, 2].map((index) => (
                        <div key={index} className="h-4 animate-pulse rounded bg-slate-100" />
                      ))}
                    </div>
                  </td>
                </tr>
              )}

              {!loading && rows.length === 0 && (
                <tr>
                  <td
                    colSpan={columns.length + (actions ? 1 : 0)}
                    className="px-4 py-10 text-center"
                  >
                    <p className="text-sm text-slate-600">{emptyMessage}</p>
                    {emptyHint && <p className="mt-1 text-xs text-slate-400">{emptyHint}</p>}
                  </td>
                </tr>
              )}

              {!loading &&
                rows.map((row) => (
                  <tr key={String(row.id)} className="align-top">
                    {columns.map((column) => (
                      <td key={column.key} className={`px-4 py-3 ${column.className || ""}`}>
                        {cell(row, column)}
                      </td>
                    ))}
                    {actions && <td className="px-4 py-3">{actions(row)}</td>}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-500">
          {loading ? "Loading…" : `Showing ${from}–${to} of ${total}`}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
            className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Previous
          </button>
          <button
            type="button"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
            className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Next <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
