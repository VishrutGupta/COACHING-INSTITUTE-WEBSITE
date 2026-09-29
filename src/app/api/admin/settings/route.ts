import { NextRequest, NextResponse } from "next/server";
import { requireUser, handleApiError, jsonError } from "@/lib/server/api";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { auditLog } from "@/lib/server/auditLog";
import { invalidateSettingsCache } from "@/lib/data/settings";
import { diffSnapshots } from "@/lib/utils/auditDiff";

/** GET /api/admin/settings — full institute row + site settings document. */
export async function GET() {
  try {
    const user = await requireUser(PERMISSIONS.SETTINGS_VIEW);
    const supabase = await createSupabaseServerClient();

    const { data: institute, error } = await supabase
      .from("institutes")
      .select("*")
      .eq("id", user.instituteId)
      .maybeSingle();

    if (error) return jsonError(error.message, 500);
    if (!institute) return jsonError("Institute not found.", 404);

    const { data: settings } = await supabase
      .from("settings")
      .select("data")
      .eq("institute_id", user.instituteId)
      .maybeSingle();

    return NextResponse.json({ institute, settings: settings?.data || {} });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PUT /api/admin/settings
 * Body: { institute: {...institute fields}, settings?: {...site content} }
 * Writes exactly ONE audit record per successful request.
 */
export async function PUT(request: NextRequest) {
  try {
    const user = await requireUser(PERMISSIONS.SETTINGS_EDIT);
    const supabase = await createSupabaseServerClient();

    const body = await request.json();
    const institutePayload = (body.institute || {}) as Record<string, unknown>;
    const settingsPayload = body.settings as Record<string, unknown> | undefined;

    const { data: before, error: beforeError } = await supabase
      .from("institutes")
      .select("*")
      .eq("id", user.instituteId)
      .maybeSingle();

    if (beforeError) return jsonError(beforeError.message, 500);
    if (!before) return jsonError("Institute not found.", 404);

    const allowed = [
      "name",
      "tagline",
      "logo_url",
      "favicon_url",
      "hero_title",
      "hero_description",
      "hero_image_url",
      "address",
      "phone",
      "whatsapp",
      "email",
      "google_maps_url",
      "instagram_url",
      "facebook_url",
      "youtube_url",
      "linkedin_url",
      "opening_hours",
      "footer_text",
      "admission_contact",
      "accent_color",
      "seo_title",
      "seo_description",
      "is_active",
    ];

    const instituteUpdate: Record<string, unknown> = {};
    for (const key of allowed) {
      if (institutePayload[key] !== undefined) {
        instituteUpdate[key] =
          typeof institutePayload[key] === "string"
            ? institutePayload[key]
            : institutePayload[key];
      }
    }

    if (Object.keys(instituteUpdate).length === 0 && !settingsPayload) {
      return jsonError("Nothing to update.", 400);
    }

    let updatedInstitute = before;

    if (Object.keys(instituteUpdate).length > 0) {
      const { data, error } = await supabase
        .from("institutes")
        .update(instituteUpdate)
        .eq("id", user.instituteId)
        .select("*")
        .single();

      if (error) return jsonError(error.message, 500);
      updatedInstitute = data;
    }

    if (settingsPayload) {
      const { data: existing } = await supabase
        .from("settings")
        .select("data")
        .eq("institute_id", user.instituteId)
        .maybeSingle();

      const merged = { ...(existing?.data || {}), ...settingsPayload };

      const { error: settingsError } = existing
        ? await supabase
            .from("settings")
            .update({ data: merged })
            .eq("institute_id", user.instituteId)
        : await supabase
            .from("settings")
            .insert({ institute_id: user.instituteId, data: merged });

      if (settingsError) return jsonError(settingsError.message, 500);
    }

    const changes = diffSnapshots(
      before as unknown as Record<string, unknown>,
      updatedInstitute as unknown as Record<string, unknown>
    );

    await auditLog({
      supabase,
      instituteId: user.instituteId,
      actorUserId: user.id,
      actorUsername: user.username,
      action: "SETTINGS_UPDATE",
      resourceType: "Settings",
      resourceId: user.instituteId,
      description: settingsPayload && changes.length === 0
        ? "Updated site content settings"
        : `Updated institute settings (${changes.length} field${changes.length === 1 ? "" : "s"})`,
      beforeData: Object.fromEntries(changes.map((c) => [c.field, c.before])),
      afterData: Object.fromEntries(changes.map((c) => [c.field, c.after])),
      metadata: settingsPayload ? { site_content_updated: true } : null,
    });

    invalidateSettingsCache();

    return NextResponse.json({ institute: updatedInstitute, changed: changes.length });
  } catch (error) {
    return handleApiError(error);
  }
}
