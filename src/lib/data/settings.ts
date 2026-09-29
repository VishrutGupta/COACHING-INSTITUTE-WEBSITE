import { createPublicSupabase } from "@/lib/supabase/public";
import type { Institute } from "@/lib/types";

export interface StatItem {
  label: string;
  value: string;
}

export interface WhyChooseUsItem {
  title: string;
  description: string;
}

export interface AboutContent {
  introduction: string;
  vision: string;
  mission: string;
  why_choose_us: string;
  teaching_philosophy: string;
  experience: string;
  achievements: string;
  cta: string;
}

export interface SiteSettings {
  stats: StatItem[];
  why_choose_us: WhyChooseUsItem[];
  about: AboutContent;
}

export const EMPTY_INSTITUTE: Institute = {
  id: "",
  name: "",
  slug: "",
  tagline: "",
  logo_url: null,
  favicon_url: null,
  hero_title: "",
  hero_description: "",
  hero_image_url: null,
  address: "",
  phone: "",
  whatsapp: "",
  email: "",
  google_maps_url: "",
  instagram_url: "",
  facebook_url: "",
  youtube_url: "",
  linkedin_url: "",
  opening_hours: "",
  footer_text: "",
  admission_contact: "",
  accent_color: "#2563eb",
  seo_title: "",
  seo_description: "",
  is_active: true,
};

export const DEFAULT_STATS: StatItem[] = [
  { label: "Students", value: "10,000+" },
  { label: "Faculty", value: "50+" },
  { label: "Courses", value: "25+" },
  { label: "Years Experience", value: "12+" },
];

export const DEFAULT_WHY_CHOOSE_US: WhyChooseUsItem[] = [
  {
    title: "Expert Faculty",
    description:
      "Learn from experienced educators who specialise in their subjects and understand exam patterns deeply.",
  },
  {
    title: "Proven Results",
    description:
      "A consistent track record of selections in competitive exams thanks to structured teaching and practice.",
  },
  {
    title: "Personal Attention",
    description:
      "Small batches, regular doubt sessions and individual performance tracking for every student.",
  },
  {
    title: "Flexible Learning",
    description:
      "Online, offline and hybrid modes so you can learn from anywhere without compromising quality.",
  },
];

export const DEFAULT_ABOUT: AboutContent = {
  introduction:
    "We are a modern coaching institute committed to helping students build strong fundamentals, exam readiness and long-term confidence.",
  vision:
    "To be the most trusted learning destination for students pursuing academic and competitive excellence.",
  mission:
    "To deliver concept-driven teaching, consistent practice and honest mentorship that turns effort into results.",
  why_choose_us:
    "Structured batches, experienced faculty, regular assessment and a supportive learning environment.",
  teaching_philosophy:
    "Clarity before speed: understand the concept, practise deliberately, and revise consistently.",
  experience:
    "Years of classroom experience across school, board and competitive examination preparation.",
  achievements:
    "Thousands of selections, top ranks and students who went on to reputed colleges and universities.",
  cta: "Talk to our counsellors and find the right batch for your goals.",
};

export const DEFAULT_SETTINGS: SiteSettings = {
  stats: DEFAULT_STATS,
  why_choose_us: DEFAULT_WHY_CHOOSE_US,
  about: DEFAULT_ABOUT,
};

const CACHE_TTL_MS = 30_000;

interface CacheEntry {
  key: string;
  value: unknown;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

function readCache<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    cache.delete(key);
    return null;
  }
  return entry.value as T;
}

function writeCache(key: string, value: unknown) {
  cache.set(key, { key, value, expiresAt: Date.now() + CACHE_TTL_MS });
}

export function invalidateSettingsCache() {
  cache.clear();
}

export function defaultInstituteSlug(): string {
  return process.env.NEXT_PUBLIC_DEFAULT_INSTITUTE_SLUG || "my-coaching-institute";
}

function hasRealConfig(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(url && key && !url.includes("your-project-ref"));
}

/** Institute identity + contact details, driven by the `institutes` table. */
export async function getInstitute(slug?: string): Promise<Institute> {
  const targetSlug = slug || defaultInstituteSlug();
  const cacheKey = `institute:${targetSlug}`;

  const cachedValue = readCache<Institute>(cacheKey);
  if (cachedValue) return cachedValue;

  if (!hasRealConfig()) return { ...EMPTY_INSTITUTE, slug: targetSlug };

  const supabase = createPublicSupabase();
  if (!supabase) return { ...EMPTY_INSTITUTE, slug: targetSlug };

  try {
    const { data, error } = await supabase
      .from("institutes")
      .select("*")
      .eq("slug", targetSlug)
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      console.error("[institute] load failed:", error.message);
      return { ...EMPTY_INSTITUTE, slug: targetSlug };
    }
    if (!data) return { ...EMPTY_INSTITUTE, slug: targetSlug };

    const institute = { ...EMPTY_INSTITUTE, ...(data as Institute) };
    writeCache(cacheKey, institute);
    return institute;
  } catch (err) {
    console.error("[institute] load error:", err);
    return { ...EMPTY_INSTITUTE, slug: targetSlug };
  }
}

function toArray<T>(value: unknown, fallback: T[]): T[] {
  return Array.isArray(value) && value.length > 0 ? (value as T[]) : fallback;
}

function mergeSettings(data: Record<string, unknown> | null): SiteSettings {
  const raw = data || {};
  return {
    stats: toArray<StatItem>(raw.stats, DEFAULT_STATS),
    why_choose_us: toArray<WhyChooseUsItem>(raw.why_choose_us, DEFAULT_WHY_CHOOSE_US),
    about: { ...DEFAULT_ABOUT, ...((raw.about as object) || {}) } as AboutContent,
  };
}

/** Editable homepage/about content, driven by the `settings` table. */
export async function getSiteSettings(slug?: string): Promise<SiteSettings> {
  const targetSlug = slug || defaultInstituteSlug();
  const cacheKey = `settings:${targetSlug}`;

  const cachedValue = readCache<SiteSettings>(cacheKey);
  if (cachedValue) return cachedValue;

  if (!hasRealConfig()) return DEFAULT_SETTINGS;

  const institute = await getInstitute(targetSlug);
  if (!institute.id) return DEFAULT_SETTINGS;

  const supabase = createPublicSupabase();
  if (!supabase) return DEFAULT_SETTINGS;

  try {
    const { data, error } = await supabase
      .from("settings")
      .select("data")
      .eq("institute_id", institute.id)
      .maybeSingle();

    if (error) {
      console.error("[settings] load failed:", error.message);
      return DEFAULT_SETTINGS;
    }

    const settings = mergeSettings((data?.data as Record<string, unknown>) || null);
    writeCache(cacheKey, settings);
    return settings;
  } catch (err) {
    console.error("[settings] load error:", err);
    return DEFAULT_SETTINGS;
  }
}
