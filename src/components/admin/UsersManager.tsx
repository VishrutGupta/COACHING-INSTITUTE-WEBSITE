"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Pencil, Trash2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, Checkbox } from "@/components/ui/Field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { PERMISSION_GROUPS, ALL_PERMISSIONS } from "@/lib/constants/permissions";

export interface UserRow {
  id: string;
  fullName: string;
  username: string;
  role: "owner" | "admin" | "staff";
  isDisabled: boolean;
  createdAt: string;
  permissions: string[];
}

interface Props {
  rows: UserRow[];
  canCreate: boolean;
  canEdit: boolean;
  currentUserId: string;
}

const EMPTY_FORM = { fullName: "", username: "", email: "", password: "", role: "staff" };

export function UsersManager({ rows, canCreate, canEdit, currentUserId }: Props) {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const [editingPermissions, setEditingPermissions] = useState<UserRow | null>(null);
  const [permissionDraft, setPermissionDraft] = useState<string[]>([]);
  const [editTarget, setEditTarget] = useState<UserRow | null>(null);
  const [editRole, setEditRole] = useState("staff");
  const [editDisabled, setEditDisabled] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);

  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Unable to create the account.");
      setShowCreate(false);
      setForm({ ...EMPTY_FORM });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create the account.");
    } finally {
      setBusy(false);
    }
  };

  const saveProfile = async () => {
    if (!editTarget) return;
    setError("");
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/users/${editTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: editTarget.role === "owner" ? undefined : editRole, isDisabled: editDisabled }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Unable to update the account.");
      setEditTarget(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update the account.");
    } finally {
      setBusy(false);
    }
  };

  const savePermissions = async () => {
    if (!editingPermissions) return;
    setError("");
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/users/${editingPermissions.id}/permissions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissions: permissionDraft }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Unable to update permissions.");
      setEditingPermissions(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update permissions.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!deleteTarget) return;
    setError("");
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/users/${deleteTarget.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Unable to delete the account.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete the account.");
    } finally {
      setBusy(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex justify-end">
        {canCreate && !showCreate && (
          <Button onClick={() => setShowCreate(true)}>
            <UserPlus className="h-4 w-4" /> New account
          </Button>
        )}
      </div>

      {showCreate && (
        <Card>
          <CardHeader>
            <CardTitle>Create account</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={create} className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="full-name">Full name *</Label>
                <Input
                  id="full-name"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="username">Username *</Label>
                <Input
                  id="username"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Select
                  id="role"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </Select>
              </div>
              <div className="flex items-end gap-2">
                <Button type="submit" loading={busy}>
                  Create account
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreate(false);
                    setError("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
            <p className="mt-3 text-xs text-slate-500">
              Owner accounts cannot be created here. The password is stored by Supabase Auth only.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Account</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Permissions</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{row.fullName || row.username}</p>
                    <p className="text-xs text-slate-500">@{row.username}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium uppercase text-slate-700">
                      {row.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        row.isDisabled
                          ? "bg-red-100 text-red-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {row.isDisabled ? "Disabled" : "Active"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {row.role === "owner"
                      ? "All permissions"
                      : `${row.permissions.length} of ${ALL_PERMISSIONS.length}`}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {row.role !== "owner" && canEdit && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingPermissions(row);
                              setPermissionDraft(row.permissions);
                            }}
                            className="rounded p-1.5 text-slate-500 hover:bg-slate-100"
                            aria-label="Edit permissions"
                            title="Edit permissions"
                          >
                            <KeyRound className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditTarget(row);
                              setEditRole(row.role);
                              setEditDisabled(row.isDisabled);
                            }}
                            className="rounded p-1.5 text-slate-500 hover:bg-slate-100"
                            aria-label="Edit account"
                            title="Edit account"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(row)}
                            disabled={row.id === currentUserId}
                            className="rounded p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                            aria-label="Delete account"
                            title="Delete account"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      {row.role === "owner" && (
                        <span className="text-xs text-slate-400">Protected</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editingPermissions && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto px-4 py-10">
          <div className="absolute inset-0 bg-black/50" onClick={() => setEditingPermissions(null)} aria-hidden />
          <div className="relative w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-base font-semibold text-slate-900">
              Permissions — {editingPermissions.username}
            </h3>
            <div className="mt-4 grid max-h-[55vh] gap-4 overflow-y-auto sm:grid-cols-2">
              {PERMISSION_GROUPS.map((group) => (
                <div key={group.label} className="rounded-lg border border-slate-200 p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {group.label}
                  </p>
                  <div className="space-y-2">
                    {group.permissions.map((permission) => (
                      <label key={permission} className="flex items-center gap-2 text-sm text-slate-700">
                        <Checkbox
                          checked={permissionDraft.includes(permission)}
                          onChange={(event) =>
                            setPermissionDraft((prev) =>
                              event.target.checked
                                ? [...prev, permission]
                                : prev.filter((value) => value !== permission)
                            )
                          }
                        />
                        {permission}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setEditingPermissions(null)}
                disabled={busy}
              >
                Cancel
              </Button>
              <Button onClick={savePermissions} loading={busy}>
                Save permissions
              </Button>
            </div>
          </div>
        </div>
      )}

      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setEditTarget(null)} aria-hidden />
          <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-base font-semibold text-slate-900">
              Edit — {editTarget.username}
            </h3>
            <div className="mt-4 space-y-4">
              <div>
                <Label htmlFor="edit-role">Role</Label>
                <Select
                  id="edit-role"
                  value={editRole}
                  onChange={(event) => setEditRole(event.target.value)}
                >
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </Select>
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <Checkbox
                  checked={editDisabled}
                  onChange={(event) => setEditDisabled(event.target.checked)}
                />
                Disable this account
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditTarget(null)} disabled={busy}>
                Cancel
              </Button>
              <Button onClick={saveProfile} loading={busy}>
                Save
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete account?"
        message={`"${deleteTarget?.username}" and all their permissions will be removed permanently.`}
        loading={busy}
        onConfirm={remove}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
