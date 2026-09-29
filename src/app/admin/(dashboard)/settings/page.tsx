import React from "react";
import { redirect } from "next/navigation";
import { getAuthUser, hasPermission } from "@/lib/server/authorization";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { PageHeader } from "@/components/admin/PageHeader";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { DEFAULT_ABOUT, DEFAULT_STATS, DEFAULT_WHY_CHOOSE_US } from "@/lib/data/settings";

export const dynamic = "force-dynamic";

interface InstituteRow {
  name: string;
  tagline: string;
  logo_url: string | null;
  favicon_url: string | null;
  hero_title: string;
  hero_description: string;
  hero_image_url: string | null;
  address: string;
  phone: string;
  whatsapp: string;
  email: string;
  google_maps_url: string;
  instagram_url: string;
  facebook_url: string;
  youtube_url: string;
  linkedin_url: string;
  opening_hours: string;
  footer_text: string;
  admission_contact: string;
  accent_color: string;
  seo_title: string;
  seo_description: string;
}

export default async function AdminSettingsPage() {
  const user = await getAuthUser();
  if (!user) redirect("/admin/login");

  if (!hasPermission(user, PERMISSIONS.SETTINGS_VIEW)) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        You do not have permission to view settings.
      </div>
    );
  }

  let institute: InstituteRow | null = null;
  let content = { stats: DEFAULT_STATS, why_choose_us: DEFAULT_WHY_CHOOSE_US, about: DEFAULT_ABOUT };
  let errorMessage = "";

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("institutes")
      .select("*")
      .eq("id", user.instituteId)
      .maybeSingle();

    if (error) errorMessage = error.message;
    else institute = data as InstituteRow;

    const { data: settingsRow } = await supabase
      .from("settings")
      .select("data")
      .eq("institute_id", user.instituteId)
      .maybeSingle();

    const raw = (settingsRow?.data || {}) as Record<string, unknown>;
    content = {
      stats: Array.isArray(raw.stats) && raw.stats.length ? raw.stats : DEFAULT_STATS,
      why_choose_us:
        Array.isArray(raw.why_choose_us) && raw.why_choose_us.length
          ? raw.why_choose_us
          : DEFAULT_WHY_CHOOSE_US,
      about: { ...DEFAULT_ABOUT, ...((raw.about as object) || {}) },
    };
  } catch {
    errorMessage = "Unable to load settings.";
  }

  if (!institute) {
    return (
      <div>
        <PageHeader title="Settings" />
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage || "Institute record not found. Run supabase/SEED_DATABASE.sql."}
        </div>
      </div>
    );
  }

  const canEdit = user.role === "owner" || hasPermission(user, PERMISSIONS.SETTINGS_EDIT);

  const initialValues = {
    name: institute.name,
    tagline: institute.tagline || "",
    logo_url: institute.logo_url || "",
    favicon_url: institute.favicon_url || "",
    hero_title: institute.hero_title || "",
    hero_description: institute.hero_description || "",
    hero_image_url: institute.hero_image_url || "",
    address: institute.address || "",
    phone: institute.phone || "",
    whatsapp: institute.whatsapp || "",
    email: institute.email || "",
    google_maps_url: institute.google_maps_url || "",
    instagram_url: institute.instagram_url || "",
    facebook_url: institute.facebook_url || "",
    youtube_url: institute.youtube_url || "",
    linkedin_url: institute.linkedin_url || "",
    opening_hours: institute.opening_hours || "",
    footer_text: institute.footer_text || "",
    admission_contact: institute.admission_contact || "",
    accent_color: institute.accent_color || "#2563eb",
    seo_title: institute.seo_title || "",
    seo_description: institute.seo_description || "",
  };

  return (
    <div>
      <PageHeader
        title="Institute settings"
        description="These values drive every page of the public website."
      />
      {!canEdit && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          You have read-only access to settings.
        </div>
      )}
      <SettingsForm institute={initialValues} content={content} canEdit={canEdit} />
    </div>
  );
}
