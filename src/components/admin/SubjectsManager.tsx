"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea, Checkbox } from "@/components/ui/Field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";

export interface SubjectRow {
  id: string;
  name: string;
  slug: string;
  description: string;
  display_order: number;
  is_active: boolean;
}

interface Props {
  rows: SubjectRow[];
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

const EMPTY = { name: "", description: "", display_order: "0", is_active: true };

export function SubjectsManager({ rows, canCreate, canEdit, canDelete }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({ ...EMPTY });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState<SubjectRow | null>(null);

  const reset = () => {
    setForm({ ...EMPTY });
    setEditingId(null);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (!form.name.trim()) {
      setError("Subject name is required.");
      return;
    }
    setBusy(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description,
        display_order: Number(form.display_order) || 0,
        is_active: form.is_active,
      };
      const res = await fetch(
        editingId ? `/api/admin/subjects/${editingId}` : "/api/admin/subjects",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Unable to save.");
      reset();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save.");
    } finally {
      setBusy(false);
    }
  };

  const patch = async (id: string, payload: Record<string, unknown>) => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/subjects/${id}`, {
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

  const move = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= rows.length) return;
    const reordered = [...rows];
    const [item] = reordered.splice(index, 1);
    reordered.splice(target, 0, item);
    setBusy(true);
    try {
      await Promise.all(
        reordered.map((row, position) =>
          fetch(`/api/admin/subjects/${row.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ display_order: position }),
          })
        )
      );
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/subjects/${deleting.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Unable to delete.");
      if (editingId === deleting.id) reset();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete.");
    } finally {
      setBusy(false);
      setDeleting(null);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          {rows.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-500">No subjects yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {rows.map((row, index) => (
                <li key={row.id} className="flex items-start justify-between gap-4 px-4 py-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-900">{row.name}</p>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => patch(row.id, { is_active: !row.is_active })}
                        className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          row.is_active
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {row.is_active ? "Active" : "Hidden"}
                      </button>
                    </div>
                    {row.description && (
                      <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">
                        {row.description}
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => move(index, -1)}
                      disabled={busy || index === 0}
                      className="rounded p-1.5 text-slate-400 hover:bg-slate-100 disabled:opacity-30"
                      aria-label="Move up"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(index, 1)}
                      disabled={busy || index === rows.length - 1}
                      className="rounded p-1.5 text-slate-400 hover:bg-slate-100 disabled:opacity-30"
                      aria-label="Move down"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(row.id);
                          setForm({
                            name: row.name,
                            description: row.description,
                            display_order: String(row.display_order),
                            is_active: row.is_active,
                          });
                        }}
                        className="rounded p-1.5 text-slate-500 hover:bg-slate-100"
                        aria-label="Edit subject"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => setDeleting(row)}
                        className="rounded p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600"
                        aria-label="Delete subject"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {(canCreate || editingId) && (
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>{editingId ? "Edit subject" : "Add subject"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <Label htmlFor="subject-name">Name *</Label>
                <Input
                  id="subject-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Physics"
                  required
                />
              </div>
              <div>
                <Label htmlFor="subject-description">Description</Label>
                <Textarea
                  id="subject-description"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="subject-active"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                />
                <label htmlFor="subject-active" className="text-sm text-slate-700">
                  Active
                </label>
              </div>
              <div className="flex gap-2">
                <Button type="submit" loading={busy}>
                  {editingId ? "Save" : "Add subject"}
                </Button>
                {editingId && (
                  <Button type="button" variant="outline" onClick={reset}>
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete subject?"
        message={`"${deleting?.name}" will be permanently removed.`}
        loading={busy}
        onConfirm={remove}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
