"use client";

import React, { useCallback, useEffect, useState } from "react";
import { ImageUp, Pencil, Plus, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, Textarea, Checkbox } from "@/components/ui/Field";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import type { Row } from "@/components/admin/CrudTable";

interface Props {
  canUpload: boolean;
  canDelete: boolean;
}

type Tab = "photos" | "albums";

export function GalleryManager({ canUpload, canDelete }: Props) {
  const [tab, setTab] = useState<Tab>("photos");
  const [albums, setAlbums] = useState<Row[]>([]);
  const [items, setItems] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<{ kind: "photo" | "album"; id: string; label: string } | null>(null);

  const [newAlbum, setNewAlbum] = useState({ title: "", description: "" });
  const [uploadAlbum, setUploadAlbum] = useState("");
  const [uploadCategory, setUploadCategory] = useState("");
  const [editing, setEditing] = useState<{ kind: Tab; id: string } | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    try {
      const [albumsRes, itemsRes] = await Promise.all([
        fetch("/api/admin/gallery/albums?limit=100"),
        fetch("/api/admin/gallery/items?limit=200"),
      ]);
      const albumsData = await albumsRes.json().catch(() => ({}));
      const itemsData = await itemsRes.json().catch(() => ({}));
      if (!albumsRes.ok) throw new Error(albumsData.error || "Unable to load albums.");
      if (!itemsRes.ok) throw new Error(itemsData.error || "Unable to load photos.");
      setAlbums(Array.isArray(albumsData.rows) ? albumsData.rows : []);
      setItems(Array.isArray(itemsData.rows) ? itemsData.rows : []);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load the gallery.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const handle = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(handle);
  }, [load]);

  const request = async (
    url: string,
    method: string,
    payload?: Record<string, unknown>
  ): Promise<Row | null> => {
    const res = await fetch(url, {
      method,
      headers: payload ? { "Content-Type": "application/json" } : undefined,
      body: payload ? JSON.stringify(payload) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Request failed.");
    return (data.row as Row) || null;
  };

  const createAlbum = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy || !newAlbum.title.trim()) return;
    setBusy(true);
    setError("");
    try {
      await request("/api/admin/gallery/albums", "POST", {
        title: newAlbum.title.trim(),
        description: newAlbum.description.trim(),
      });
      setNewAlbum({ title: "", description: "" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create the album.");
    } finally {
      setBusy(false);
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const folder = `gallery/${uploadAlbum || "general"}`;
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", "gallery-images");
      formData.append("folder", folder);

      const uploadRes = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const uploadData = await uploadRes.json().catch(() => ({}));
      if (!uploadRes.ok) throw new Error(uploadData.error || "Upload failed.");

      await request("/api/admin/gallery/items", "POST", {
        image_url: uploadData.url,
        title: file.name.replace(/\.[^.]+$/, ""),
        category: uploadCategory.trim() || "General",
        album_id: uploadAlbum || null,
        display_order: 0,
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to upload the photo.");
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (kind: Tab, row: Row) => {
    setEditing({ kind, id: String(row.id) });
    setDraft({
      title: String(row.title || ""),
      description: String(row.description || ""),
      category: String(row.category || ""),
      album_id: String(row.album_id || ""),
      cover_url: String(row.cover_url || ""),
      image_url: String(row.image_url || ""),
      is_active: row.is_active ? "1" : "0",
    });
  };

  const saveEdit = async () => {
    if (!editing || busy) return;
    setBusy(true);
    setError("");
    try {
      const url =
        editing.kind === "albums"
          ? `/api/admin/gallery/albums/${editing.id}`
          : `/api/admin/gallery/items/${editing.id}`;
      const payload: Record<string, unknown> =
        editing.kind === "albums"
          ? {
              title: draft.title,
              description: draft.description,
              cover_url: draft.cover_url || null,
              is_active: draft.is_active === "1",
            }
          : {
              title: draft.title,
              category: draft.category,
              album_id: draft.album_id || null,
              image_url: draft.image_url,
              is_active: draft.is_active === "1",
            };
      await request(url, "PATCH", payload);
      setEditing(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!confirm || busy) return;
    setBusy(true);
    setError("");
    try {
      const url =
        confirm.kind === "album"
          ? `/api/admin/gallery/albums/${confirm.id}`
          : `/api/admin/gallery/items/${confirm.id}`;
      await request(url, "DELETE");
      setConfirm(null);
      if (editing?.id === confirm.id) setEditing(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete.");
      setConfirm(null);
    } finally {
      setBusy(false);
    }
  };

  const move = async (row: Row, direction: -1 | 1) => {
    if (busy) return;
    const list = items;
    const index = list.findIndex((item) => String(item.id) === String(row.id));
    const neighbour = list[index + direction];
    if (!neighbour) return;
    setBusy(true);
    setError("");
    try {
      const nextOrder = Number(neighbour.display_order || 0) + (direction === -1 ? -1 : 1);
      await request(`/api/admin/gallery/items/${String(row.id)}`, "PATCH", {
        display_order: nextOrder,
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to reorder.");
    } finally {
      setBusy(false);
    }
  };

  const toggleAlbum = async (row: Row) => {
    if (busy) return;
    setBusy(true);
    try {
      await request(`/api/admin/gallery/albums/${String(row.id)}`, "PATCH", {
        is_active: !row.is_active,
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update the album.");
    } finally {
      setBusy(false);
    }
  };

  const editingRow = !editing
    ? undefined
    : editing.kind === "albums"
      ? albums.find((row) => String(row.id) === editing.id)
      : items.find((row) => String(row.id) === editing.id);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {(["photos", "albums"] as Tab[]).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setTab(value);
              setEditing(null);
            }}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === value ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {value === "photos" ? "Photos" : "Albums"}
          </button>
        ))}
        <p className="ml-auto text-xs text-slate-500">
          {tab === "photos" ? `${items.length} photos` : `${albums.length} albums`}
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {tab === "photos" && (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          {canUpload ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="sm:w-56">
                <Label htmlFor="upload-album">Album</Label>
                <Select
                  id="upload-album"
                  value={uploadAlbum}
                  onChange={(event) => setUploadAlbum(event.target.value)}
                >
                  <option value="">No album (general)</option>
                  {albums.map((album) => (
                    <option key={String(album.id)} value={String(album.id)}>
                      {String(album.title)}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="sm:w-48">
                <Label htmlFor="upload-category">Category</Label>
                <Input
                  id="upload-category"
                  value={uploadCategory}
                  onChange={(event) => setUploadCategory(event.target.value)}
                  placeholder="Campus"
                />
              </div>
              <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800">
                <ImageUp className="h-4 w-4" />
                {busy ? "Working…" : "Upload photo"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={busy}
                  onChange={handleUpload}
                />
              </label>
            </div>
          ) : (
            <p className="text-sm text-slate-500">You have read-only access to the gallery.</p>
          )}
        </div>
      )}

      {tab === "albums" && canUpload && (
        <form onSubmit={createAlbum} className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_2fr_auto] sm:items-end">
            <div>
              <Label htmlFor="album-title">Album title *</Label>
              <Input
                id="album-title"
                value={newAlbum.title}
                onChange={(event) => setNewAlbum({ ...newAlbum, title: event.target.value })}
                placeholder="Campus life"
                required
              />
            </div>
            <div>
              <Label htmlFor="album-description">Description</Label>
              <Input
                id="album-description"
                value={newAlbum.description}
                onChange={(event) => setNewAlbum({ ...newAlbum, description: event.target.value })}
                placeholder="Highlights from this term"
              />
            </div>
            <Button type="submit" loading={busy}>
              <Plus className="h-4 w-4" /> Add album
            </Button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((index) => (
            <div key={index} className="h-40 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      ) : tab === "photos" ? (
        items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
            <p className="text-sm text-slate-600">No photos yet.</p>
            {canUpload && <p className="mt-1 text-xs text-slate-400">Upload your first image above.</p>}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((item, index) => {
              const isEditing = editing?.kind === "photos" && editing.id === String(item.id);
              const album = albums.find((value) => String(value.id) === String(item.album_id));
              return (
                <div
                  key={String(item.id)}
                  className={`overflow-hidden rounded-xl border bg-white ${isEditing ? "border-slate-900" : "border-slate-200"}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={String(item.image_url || "")}
                    alt={String(item.title || "")}
                    className={`h-40 w-full object-cover ${item.is_active ? "" : "opacity-50"}`}
                  />
                  <div className="space-y-1 p-3">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {String(item.title || "Untitled")}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {[item.category, album ? album.title : "", item.is_active ? "" : "Draft"]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>

                    {isEditing && editingRow ? (
                      <div className="space-y-2 pt-2">
                        <Input
                          value={draft.title}
                          onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                          placeholder="Title"
                        />
                        <Input
                          value={draft.category}
                          onChange={(event) => setDraft({ ...draft, category: event.target.value })}
                          placeholder="Category"
                        />
                        <Select
                          value={draft.album_id}
                          onChange={(event) => setDraft({ ...draft, album_id: event.target.value })}
                        >
                          <option value="">No album</option>
                          {albums.map((value) => (
                            <option key={String(value.id)} value={String(value.id)}>
                              {String(value.title)}
                            </option>
                          ))}
                        </Select>
                        <label className="flex items-center gap-2 text-xs text-slate-700">
                          <Checkbox
                            checked={draft.is_active === "1"}
                            onChange={(event) =>
                              setDraft({ ...draft, is_active: event.target.checked ? "1" : "0" })
                            }
                          />
                          Published
                        </label>
                        <div className="flex gap-2">
                          <Button size="sm" loading={busy} onClick={saveEdit}>
                            Save
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditing(null)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex gap-1">
                          <button
                            type="button"
                            disabled={busy || index === 0}
                            onClick={() => move(item, -1)}
                            className="rounded p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-40"
                            aria-label="Move up"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            disabled={busy || index === items.length - 1}
                            onClick={() => move(item, 1)}
                            className="rounded p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-40"
                            aria-label="Move right"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="flex gap-1">
                          {canUpload && (
                            <button
                              type="button"
                              onClick={() => startEdit("photos", item)}
                              className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                              aria-label="Edit photo"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              type="button"
                              onClick={() =>
                                setConfirm({
                                  kind: "photo",
                                  id: String(item.id),
                                  label: String(item.title || "photo"),
                                })
                              }
                              className="rounded p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600"
                              aria-label="Delete photo"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : albums.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <p className="text-sm text-slate-600">No albums yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {albums.map((album) => {
            const isEditing = editing?.kind === "albums" && editing.id === String(album.id);
            const count = items.filter((item) => String(item.album_id) === String(album.id)).length;
            return (
              <div
                key={String(album.id)}
                className={`rounded-xl border bg-white p-4 ${isEditing ? "border-slate-900" : "border-slate-200"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-900">{String(album.title)}</p>
                    <p className="text-xs text-slate-500">
                      {count} photo{count === 1 ? "" : "s"} · {album.is_active ? "Published" : "Draft"}
                    </p>
                    {album.description ? (
                      <p className="mt-1 text-sm text-slate-600">{String(album.description)}</p>
                    ) : null}
                  </div>
                  <div className="flex gap-1">
                    {canUpload && (
                      <button
                        type="button"
                        onClick={() => startEdit("albums", album)}
                        className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                        aria-label="Edit album"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() =>
                          setConfirm({ kind: "album", id: String(album.id), label: String(album.title) })
                        }
                        className="rounded p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600"
                        aria-label="Delete album"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {isEditing && editingRow && (
                  <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                    <div>
                      <Label htmlFor={`album-title-${String(album.id)}`}>Title</Label>
                      <Input
                        id={`album-title-${String(album.id)}`}
                        value={draft.title}
                        onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`album-desc-${String(album.id)}`}>Description</Label>
                      <Textarea
                        id={`album-desc-${String(album.id)}`}
                        rows={2}
                        value={draft.description}
                        onChange={(event) => setDraft({ ...draft, description: event.target.value })}
                      />
                    </div>
                    <label className="flex items-center gap-2 text-xs text-slate-700">
                      <Checkbox
                        checked={draft.is_active === "1"}
                        onChange={(event) =>
                          setDraft({ ...draft, is_active: event.target.checked ? "1" : "0" })
                        }
                      />
                      Published (shown on the public gallery)
                    </label>
                    <div className="flex gap-2">
                      <Button size="sm" loading={busy} onClick={saveEdit}>
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditing(null)}>
                        Cancel
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => toggleAlbum(album)}>
                        {album.is_active ? "Unpublish" : "Publish"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(confirm)}
        title={`Delete ${confirm?.kind === "album" ? "album" : "photo"}?`}
        message={`"${confirm?.label || ""}" will be permanently removed. This action cannot be undone.`}
        loading={busy}
        onConfirm={remove}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}
