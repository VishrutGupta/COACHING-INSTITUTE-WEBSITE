"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { notifyCrudChange, type Row } from "@/components/admin/CrudTable";

export interface RowToggle {
  key: string;
  activeLabel: string;
  inactiveLabel: string;
  tone?: "publish" | "highlight";
}

interface Props {
  endpoint: string;
  row: Row;
  label: string;
  editHref?: string;
  toggles?: RowToggle[];
  extra?: React.ReactNode;
}

export function ResourceRowActions({ endpoint, row, label, editHref, toggles = [], extra }: Props) {
  const id = String(row.id);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const patch = async (payload: Record<string, unknown>) => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`${endpoint}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Unable to update.");
      notifyCrudChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`${endpoint}/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Unable to delete.");
      setConfirming(false);
      notifyCrudChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete.");
      setConfirming(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {toggles.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {toggles.map((toggle) => {
            const active = Boolean(row[toggle.key]);
            const highlight = toggle.tone === "highlight";
            return (
              <button
                key={toggle.key}
                type="button"
                disabled={busy}
                onClick={() => patch({ [toggle.key]: !active })}
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                  active
                    ? highlight
                      ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                      : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
                title="Toggle state"
              >
                {active ? toggle.activeLabel : toggle.inactiveLabel}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex items-center gap-1">
        {editHref && (
          <Link
            href={editHref}
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            aria-label={`Edit ${label}`}
          >
            <Pencil className="h-4 w-4" />
          </Link>
        )}
        {extra}
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="rounded-md p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600"
          aria-label={`Delete ${label}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {error && <p className="max-w-[180px] text-xs text-red-600">{error}</p>}

      <ConfirmDialog
        open={confirming}
        title="Delete?"
        message={`"${label}" will be permanently removed. This action cannot be undone.`}
        loading={busy}
        onConfirm={remove}
        onCancel={() => setConfirming(false)}
      />
    </div>
  );
}
