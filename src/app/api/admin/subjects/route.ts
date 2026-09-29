import { NextRequest, NextResponse } from "next/server";
import { requireUser, handleApiError, jsonError } from "@/lib/server/api";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { auditLog } from "@/lib/server/auditLog";
import { slugify } from "@/lib/utils/slug";

const SUBJECT_SELECT = "id, institute_id, name, slug, description, display_order, is_active, created_at, updated_at";

export async function GET() {
  try {
    const user = await requireUser(PERMISSIONS.SUBJECTS_VIEW);
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("subjects")
      .select(SUBJECT_SELECT)
      .eq("institute_id", user.instituteId)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) return jsonError(error.message, 500);

    return NextResponse.json({ subjects: data || [] });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(PERMISSIONS.SUBJECTS_CREATE);
    const supabase = await createSupabaseServerClient();

    const body = await request.json();
    const name = (body.name || "").trim();
    if (!name) return jsonError("Subject name is required.", 400);

    let slug = slugify(body.slug || name) || "subject";

    const { data: others } = await supabase
      .from("subjects")
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
      description: body.description || "",
      display_order: Number(body.display_order) || 0,
      is_active: body.is_active !== false,
    };

    const { data, error } = await supabase
      .from("subjects")
      .insert(payload)
      .select(SUBJECT_SELECT)
      .single();

    if (error) return jsonError(error.message, 500);

    await auditLog({
      supabase,
      instituteId: user.instituteId,
      actorUserId: user.id,
      actorUsername: user.username,
      action: "SUBJECT_CREATE",
      resourceType: "Subject",
      resourceId: data.id,
      description: `Created subject "${name}"`,
      afterData: payload as unknown as Record<string, unknown>,
    });

    return NextResponse.json({ subject: data }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
