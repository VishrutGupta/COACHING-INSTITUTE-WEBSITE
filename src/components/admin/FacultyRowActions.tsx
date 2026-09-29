"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";

interface Props {
  id: string;
  name: string;
  isActive: boolean;
  featured: boolean;
}

export function FacultyRowActions({ id, name, isActive, featured }: Props) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const patch = async (payload: Record<string, unknown>) => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/faculty/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Unable to update.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/faculty/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Unable to delete.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete.");
    } finally {
      setBusy(false);
      setConfirming(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => patch({ is_active: !isActive })}
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            isActive
              ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          {isActive ? "Published" : "Draft"}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => patch({ featured: !featured })}
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            featured
              ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
              : "bg-slate-100 text-slate-500 hover:bg-slate-200"
          }`}
        >
          {featured ? "Featured" : "Not featured"}
        </button>
      </div>

      <div className="flex items-center gap-1">
        <Link
          href={`/admin/faculty/${id}/edit`}
          className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          aria-label={`Edit ${name}`}
        >
          <Pencil className="h-4 w-4" />
        </Link>
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="rounded-md p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600"
          aria-label={`Delete ${name}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <ConfirmDialog
        open={confirming}
        title="Delete faculty member?"
        message={`"${name}" will be permanently removed.`}
        loading={busy}
        onConfirm={remove}
        onCancel={() => setConfirming(false)}
      />
    </div>
  );
}
