import { NextRequest, NextResponse } from "next/server";
import { requireUser, handleApiError, jsonError } from "@/lib/server/api";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PERMISSIONS } from "@/lib/constants/permissions";
import {
  STORAGE_BUCKETS,
  assertValidImage,
  assertValidDocument,
  uploadFile,
  deleteFile,
  type BucketName,
} from "@/lib/server/storage";

const ALLOWED_BUCKETS: BucketName[] = [
  STORAGE_BUCKETS.INSTITUTE_ASSETS,
  STORAGE_BUCKETS.COURSE_IMAGES,
  STORAGE_BUCKETS.COURSE_BROCHURES,
  STORAGE_BUCKETS.FACULTY_PHOTOS,
  STORAGE_BUCKETS.GALLERY_IMAGES,
];

const DOCUMENT_BUCKETS: BucketName[] = [STORAGE_BUCKETS.COURSE_BROCHURES];

/**
 * POST /api/admin/upload (multipart/form-data)
 * Fields: file, bucket, folder?
 * Original filename, MIME type, extension and raw bytes are preserved.
 */
export async function POST(request: NextRequest) {
  try {
    await requireUser(PERMISSIONS.STORAGE_UPLOAD);
    const supabase = await createSupabaseServerClient();

    const formData = await request.formData();
    const file = formData.get("file");
    const bucket = String(formData.get("bucket") || "") as BucketName;
    const folder = String(formData.get("folder") || "").replace(/[^a-zA-Z0-9/_-]/g, "");

    if (!(file instanceof File)) return jsonError("No file supplied.", 400);
    if (!ALLOWED_BUCKETS.includes(bucket)) return jsonError("Unknown storage bucket.", 400);

    const isDocument = DOCUMENT_BUCKETS.includes(bucket);
    if (isDocument) assertValidDocument(file);
    else assertValidImage(file);

    const uploaded = await uploadFile(supabase, bucket, folder, file, {
      keepOriginalName: isDocument,
    });

    return NextResponse.json(
      {
        url: uploaded.url,
        path: uploaded.path,
        filename: uploaded.filename,
        mimeType: uploaded.mimeType,
        size: uploaded.size,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/admin/upload?bucket=&path=
 * Removes a stored object. Requires storage.delete.
 */
export async function DELETE(request: NextRequest) {
  try {
    await requireUser(PERMISSIONS.STORAGE_DELETE);
    const supabase = await createSupabaseServerClient();

    const { searchParams } = request.nextUrl;
    const bucket = String(searchParams.get("bucket") || "") as BucketName;
    const path = searchParams.get("path") || "";

    if (!ALLOWED_BUCKETS.includes(bucket)) return jsonError("Unknown storage bucket.", 400);
    if (!path) return jsonError("Missing path.", 400);

    await deleteFile(supabase, bucket, path);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
