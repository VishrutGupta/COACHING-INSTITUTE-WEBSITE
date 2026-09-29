export interface AuditChange {
  field: string;
  before: unknown;
  after: unknown;
  type: "changed" | "added" | "removed";
}

const FIELD_LABELS: Record<string, string> = {
  title: "Title",
  name: "Name",
  slug: "Slug",
  fee: "Fee",
  original_price: "Original Fee",
  discount: "Discount",
  duration: "Duration",
  mode: "Mode",
  category: "Category",
  exam: "Exam",
  short_description: "Short Description",
  description: "Description",
  eligibility: "Eligibility",
  highlights: "Highlights",
  syllabus: "Syllabus",
  cover_image_url: "Cover Photo",
  gallery_urls: "Gallery Images",
  brochure_url: "Brochure",
  featured: "Featured",
  is_active: "Published",
  display_order: "Display Order",
  start_date: "Start Date",
  end_date: "End Date",
  target_audience: "Target Audience",
  seo_title: "SEO Title",
  seo_description: "SEO Description",
  whatsapp_number: "WhatsApp Number",
  designation: "Designation",
  subject: "Subject",
  qualification: "Qualification",
  experience: "Experience",
  bio: "Bio",
  specialization: "Specialization",
  achievements: "Achievements",
  profile_image: "Profile Photo",
  linkedin_url: "LinkedIn",
  social_links: "Social Links",
  description_: "Description",
  phone: "Phone",
  whatsapp: "WhatsApp",
  email: "Email",
  address: "Address",
  tagline: "Tagline",
  hero_title: "Hero Title",
  hero_description: "Hero Description",
  hero_image_url: "Hero Image",
  logo_url: "Logo",
  favicon_url: "Favicon",
  accent_color: "Accent Color",
  google_maps_url: "Google Maps",
  instagram_url: "Instagram",
  facebook_url: "Facebook",
  youtube_url: "YouTube",
  linkedin_url_: "LinkedIn",
  opening_hours: "Opening Hours",
  footer_text: "Footer",
  admission_contact: "Admission Contact",
  seo_title_: "Default SEO Title",
  seo_description_: "Default SEO Description",
  full_name: "Full Name",
  username: "Username",
  role: "Role",
  is_disabled: "Status",
  permission: "Permission",
};

export function fieldLabel(key: string): string {
  return FIELD_LABELS[key] || key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function normalize(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.map((item) => String(item)).join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

/**
 * Compares two snapshots and returns only the fields that actually changed.
 * Used by the audit UI to render red (old) -> green (new) rows.
 */
export function diffSnapshots(
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null
): AuditChange[] {
  const changes: AuditChange[] = [];
  const beforeData = before || {};
  const afterData = after || {};
  const keys = Array.from(new Set([...Object.keys(beforeData), ...Object.keys(afterData)]));

  for (const key of keys) {
    if (key === "updated_at" || key === "created_at") continue;

    const prev = beforeData[key];
    const next = afterData[key];

    if (normalize(prev) === normalize(next)) continue;

    if (prev === undefined || prev === null || prev === "") {
      if (next === undefined || next === null || next === "") continue;
      changes.push({ field: key, before: prev, after: next, type: "added" });
    } else if (next === undefined || next === null || next === "") {
      changes.push({ field: key, before: prev, after: next, type: "removed" });
    } else {
      changes.push({ field: key, before: prev, after: next, type: "changed" });
    }
  }

  return changes;
}

export function displayValue(value: unknown): string {
  const normalized = normalize(value);
  if (normalized === "") return "—";
  if (normalized.length > 300) return `${normalized.slice(0, 300)}…`;
  return normalized;
}
