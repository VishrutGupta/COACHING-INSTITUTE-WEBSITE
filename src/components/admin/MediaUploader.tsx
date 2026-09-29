"use client";

import React, { useRef, useState } from "react";
import { ImageUp, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";

interface Props {
  bucket: string;
  folder?: string;
  label: string;
  value: string;
  onChange: (url: string) => void;
  kind?: "image" | "document";
  hint?: string;
  className?: string;
}

/**
 * Uploads directly to Supabase Storage through the authenticated API route.
 * The original filename, MIME type and raw bytes are preserved for documents.
 */
export function MediaUploader({
  bucket,
  folder = "",
  label,
  value,
  onChange,
  kind = "image",
  hint,
  className,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [localName, setLocalName] = useState("");

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", bucket);
      formData.append("folder", folder);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Upload failed.");

      onChange(data.url);
      setLocalName(data.filename || file.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const accept = kind === "image" ? "image/*" : ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.csv";

  return (
    <div className={cn("", className)}>
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>

      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(event) => handleFile(event.target.files?.[0])}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            loading={uploading}
            onClick={() => inputRef.current?.click()}
          >
            <ImageUp className="h-3.5 w-3.5" />
            {value ? "Replace" : "Upload"}
          </Button>

          {value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                onChange("");
                setLocalName("");
              }}
            >
              <Trash2 className="h-3.5 w-3.5" /> Remove
            </Button>
          )}

          <span className="truncate text-xs text-slate-500">
            {localName || (value ? "Uploaded" : "No file selected")}
          </span>
        </div>

        {value && kind === "image" && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt=""
            className="mt-3 h-24 w-24 rounded-lg border border-slate-200 object-cover"
          />
        )}

        {value && kind === "document" && (
          <a
            href={value}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-block truncate text-xs text-blue-600 underline"
          >
            {localName || "View uploaded document"}
          </a>
        )}
      </div>

      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
