import { NextRequest, NextResponse } from "next/server";
import { requireUser, handleApiError, jsonError } from "@/lib/server/api";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { auditLog } from "@/lib/server/auditLog";
import { slugify } from "@/lib/utils/slug";

const COURSE_SELECT =
  "id, institute_id, title, slug, short_description, description, category, exam, target_audience, duration, fee, original_price, discount, mode, start_date, end_date, cover_image_url, gallery_urls, brochure_url, highlights, syllabus, eligibility, featured, is_active, display_order, whatsapp_number, seo_title, seo_description, created_at, updated_at";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(PERMISSIONS.COURSES_VIEW);
    const supabase = await createSupabaseServerClient();

    const { searchParams } = request.nextUrl;
    const includeInactive = searchParams.get("all") === "1";

    let query = supabase
      .from("courses")
      .select(COURSE_SELECT)
      .eq("institute_id", user.instituteId)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (!includeInactive) query = query.eq("is_active", true);

    const { data, error } = await query;
    if (error) return jsonError(error.message, 500);

    return NextResponse.json({ courses: data || [] });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(PERMISSIONS.COURSES_CREATE);
    const supabase = await createSupabaseServerClient();

    const body = await request.json();
    const title = (body.title || "").trim();
    if (!title) return jsonError("Course title is required.", 400);

    let slug = slugify(body.slug || title);
    if (!slug) slug = "course";

    const { data: existing } = await supabase
      .from("courses")
      .select("id")
      .eq("institute_id", user.instituteId)
      .eq("slug", slug)
      .maybeSingle();

    if (existing) {
      const { data: others } = await supabase
        .from("courses")
        .select("slug")
        .eq("institute_id", user.instituteId);
      const slugs = (others || []).map((row) => row.slug as string);
      let counter = 2;
      let candidate = `${slug}-${counter}`;
      while (slugs.includes(candidate)) {
        counter += 1;
        candidate = `${slug}-${counter}`;
      }
      slug = candidate;
    }

    const payload = {
      institute_id: user.instituteId,
      title,
      slug,
      short_description: body.short_description || "",
      description: body.description || "",
      category: body.category || "",
      exam: body.exam || "",
      target_audience: body.target_audience || "",
      duration: body.duration || "",
      fee: Number(body.fee) || 0,
      original_price: body.original_price ? Number(body.original_price) : null,
      discount: body.discount || "",
      mode: ["Online", "Offline", "Hybrid"].includes(body.mode) ? body.mode : "Offline",
      start_date: body.start_date || null,
      end_date: body.end_date || null,
      cover_image_url: body.cover_image_url || null,
      gallery_urls: Array.isArray(body.gallery_urls) ? body.gallery_urls : [],
      brochure_url: body.brochure_url || null,
      highlights: Array.isArray(body.highlights) ? body.highlights : [],
      syllabus: Array.isArray(body.syllabus) ? body.syllabus : [],
      eligibility: body.eligibility || "",
      featured: Boolean(body.featured),
      is_active: body.is_active !== false,
      display_order: Number(body.display_order) || 0,
      whatsapp_number: body.whatsapp_number || "",
      seo_title: body.seo_title || "",
      seo_description: body.seo_description || "",
    };

    const { data, error } = await supabase
      .from("courses")
      .insert(payload)
      .select(COURSE_SELECT)
      .single();

    if (error) return jsonError(error.message, 500);

    await auditLog({
      supabase,
      instituteId: user.instituteId,
      actorUserId: user.id,
      actorUsername: user.username,
      action: "COURSE_CREATE",
      resourceType: "Course",
      resourceId: data.id,
      description: `Created course "${title}"`,
      afterData: payload as unknown as Record<string, unknown>,
    });

    return NextResponse.json({ course: data }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
