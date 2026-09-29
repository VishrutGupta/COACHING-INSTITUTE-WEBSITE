import { NextRequest, NextResponse } from "next/server";
import { requireUser, handleApiError, jsonError } from "@/lib/server/api";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { auditLog } from "@/lib/server/auditLog";
import { slugify } from "@/lib/utils/slug";

const FACULTY_SELECT =
  "id, institute_id, name, slug, designation, subject, qualification, experience, bio, specialization, achievements, profile_image, linkedin_url, social_links, display_order, is_active, featured, created_at, updated_at";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(PERMISSIONS.FACULTY_VIEW);
    const supabase = await createSupabaseServerClient();

    const includeInactive = request.nextUrl.searchParams.get("all") === "1";

    let query = supabase
      .from("faculty")
      .select(FACULTY_SELECT)
      .eq("institute_id", user.instituteId)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (!includeInactive) query = query.eq("is_active", true);

    const { data, error } = await query;
    if (error) return jsonError(error.message, 500);

    return NextResponse.json({ faculty: data || [] });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(PERMISSIONS.FACULTY_CREATE);
    const supabase = await createSupabaseServerClient();

    const body = await request.json();
    const name = (body.name || "").trim();
    if (!name) return jsonError("Faculty name is required.", 400);

    let slug = slugify(body.slug || name);
    if (!slug) slug = "faculty";

    const { data: others } = await supabase
      .from("faculty")
      .select("slug")
      .eq("institute_id", user.instituteId);

    const slugs = (others || []).map((row) => row.slug as string);
    if (slugs.includes(slug)) {
      let counter = 2;
      while (slugs.includes(`${slug}-${counter}`)) counter += 1;
      slug = `${slug}-${counter}`;
    }

    const payload = {
      institute_id: user.instituteId,
      name,
      slug,
      designation: body.designation || "",
      subject: body.subject || "",
      qualification: body.qualification || "",
      experience: body.experience || "",
      bio: body.bio || "",
      specialization: body.specialization || "",
      achievements: body.achievements || "",
      profile_image: body.profile_image || null,
      linkedin_url: body.linkedin_url || "",
      social_links:
        body.social_links && typeof body.social_links === "object" ? body.social_links : {},
      display_order: Number(body.display_order) || 0,
      is_active: body.is_active !== false,
      featured: Boolean(body.featured),
    };

    const { data, error } = await supabase
      .from("faculty")
      .insert(payload)
      .select(FACULTY_SELECT)
      .single();

    if (error) return jsonError(error.message, 500);

    await auditLog({
      supabase,
      instituteId: user.instituteId,
      actorUserId: user.id,
      actorUsername: user.username,
      action: "FACULTY_CREATE",
      resourceType: "Faculty",
      resourceId: data.id,
      description: `Added faculty member "${name}"`,
      afterData: payload as unknown as Record<string, unknown>,
    });

    return NextResponse.json({ faculty: data }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
