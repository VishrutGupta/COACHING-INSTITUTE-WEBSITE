import { NextRequest, NextResponse } from "next/server";
import { createPublicSupabase } from "@/lib/supabase/public";
import { STORAGE_BUCKETS, extractStoragePath } from "@/lib/server/storage";

const MIME_MAP: Record<string, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.document",
  txt: "text/plain",
  csv: "text/csv",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
};

function filenameFromPath(path: string): string {
  const segment = path.split("/").pop() || "download";
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

/**
 * GET /api/download?bucket=&path=
 * Streams the ORIGINAL stored file back with the original filename.
 * PDFs download as application/pdf with attachment disposition — never
 * converted to text.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const bucket = searchParams.get("bucket") || "";
  const rawPath = searchParams.get("path") || "";

  if (!bucket || !rawPath) {
    return NextResponse.json({ error: "Missing bucket or path." }, { status: 400 });
  }

  const knownBuckets = Object.values(STORAGE_BUCKETS) as string[];
  if (!knownBuckets.includes(bucket)) {
    return NextResponse.json({ error: "Unknown bucket." }, { status: 400 });
  }

  const supabase = createPublicSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Storage is not configured." }, { status: 503 });
  }

  const path = extractStoragePath(bucket, rawPath) || rawPath.replace(/^\/+/, "");
  if (!path) {
    return NextResponse.json({ error: "Invalid path." }, { status: 400 });
  }

  const { data, error } = await supabase.storage.from(bucket).download(path);

  if (error || !data) {
    console.error("[download] failed:", error?.message || "not found");
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }

  const filename = filenameFromPath(path);
  const extension = (filename.split(".").pop() || "").toLowerCase();
  const contentType = MIME_MAP[extension] || data.type || "application/octet-stream";

  const buffer = Buffer.from(await data.arrayBuffer());

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(buffer.byteLength),
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, max-age=0, must-revalidate",
    },
  });
}
