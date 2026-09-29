import type { SupabaseClient } from "@supabase/supabase-js";

export const STORAGE_BUCKETS = {
  INSTITUTE_ASSETS: "institute-assets",
  COURSE_IMAGES: "course-images",
  COURSE_BROCHURES: "course-brochures",
  FACULTY_PHOTOS: "faculty-photos",
  GALLERY_IMAGES: "gallery-images",
} as const;

export type BucketName = (typeof STORAGE_BUCKETS)[keyof typeof STORAGE_BUCKETS];

export const IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

export const DOCUMENT_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.document",
  "text/plain",
  "text/csv",
]);

export const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
export const MAX_DOCUMENT_SIZE = 25 * 1024 * 1024;

export interface UploadedFile {
  url: string;
  path: string;
  filename: string;
  mimeType: string;
  size: number;
}

function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
}

function uniqueSuffix(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function assertValidImage(file: File): void {
  if (!IMAGE_MIME_TYPES.has(file.type)) {
    throw new Error("Invalid image format. Please upload JPG, PNG, WebP or AVIF.");
  }
  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error("Image exceeds the 10MB size limit.");
  }
}

export function assertValidDocument(file: File): void {
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  const allowedExt = ["pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "txt", "csv"];
  if (!DOCUMENT_MIME_TYPES.has(file.type) && !allowedExt.includes(ext)) {
    throw new Error("Unsupported document format. Please upload a PDF or Office document.");
  }
  if (file.size > MAX_DOCUMENT_SIZE) {
    throw new Error("Document exceeds the 25MB size limit.");
  }
}

/**
 * Uploads a file to Supabase Storage, preserving the original filename,
 * MIME type, extension and raw file contents.
 */
export async function uploadFile(
  supabase: SupabaseClient,
  bucket: BucketName,
  folder: string,
  file: File,
  options?: { keepOriginalName?: boolean }
): Promise<UploadedFile> {
  const original = sanitizeFilename(file.name) || "file";
  const finalName = options?.keepOriginalName ? original : `${uniqueSuffix()}-${original}`;
  const path = folder ? `${folder.replace(/\/+$/, "")}/${finalName}` : finalName;

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || undefined,
  });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);

  return {
    url: data.publicUrl,
    path,
    filename: original,
    mimeType: file.type,
    size: file.size,
  };
}

export async function deleteFile(
  supabase: SupabaseClient,
  bucket: BucketName,
  pathOrUrl: string
): Promise<void> {
  const path = extractStoragePath(bucket, pathOrUrl) || pathOrUrl;
  if (!path) return;
  await supabase.storage.from(bucket).remove([path]);
}

/** Turns a public storage URL back into a bucket-relative object path. */
export function extractStoragePath(bucket: string, value: string): string | null {
  if (!value) return null;
  if (!value.startsWith("http")) return value.replace(/^\/+/, "");

  try {
    const url = new URL(value);
    const segments = url.pathname.split("/").filter(Boolean);
    const objectIdx = segments.indexOf("object");
    if (objectIdx === -1) return null;

    const mode = segments[objectIdx + 1];
    const bucketIdx = mode === "public" || mode === "sign" ? objectIdx + 2 : objectIdx + 1;
    const foundBucket = segments[bucketIdx];
    if (foundBucket !== bucket) return null;

    return decodeURIComponent(segments.slice(bucketIdx + 1).join("/"));
  } catch {
    return null;
  }
}

export function bucketFromUrl(value: string): BucketName | null {
  for (const bucket of Object.values(STORAGE_BUCKETS)) {
    if (extractStoragePath(bucket, value)) return bucket;
  }
  return null;
}
