import type { MetadataRoute } from "next";
import { defaultInstituteSlug } from "@/lib/data/settings";
import { getCourseSlugs, getFacultySlugs } from "@/lib/data/public";

function siteUrl(): string {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ||
    `https://${defaultInstituteSlug()}.example.com`;
  return base.replace(/\/+$/, "");
}

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const lastModified = new Date();

  const staticRoutes = [
    { path: "", priority: 1 },
    { path: "/courses", priority: 0.9 },
    { path: "/faculty", priority: 0.8 },
    { path: "/about", priority: 0.7 },
    { path: "/contact", priority: 0.8 },
    { path: "/gallery", priority: 0.6 },
    { path: "/testimonials", priority: 0.6 },
    { path: "/faq", priority: 0.6 },
  ].map((route) => ({
    url: `${base}${route.path}`,
    lastModified,
    changeFrequency: "weekly" as const,
    priority: route.priority,
  }));

  const [courseSlugs, facultySlugs] = await Promise.all([
    getCourseSlugs(),
    getFacultySlugs(),
  ]);

  const courseRoutes = courseSlugs.map((slug) => ({
    url: `${base}/courses/${slug}`,
    lastModified,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const facultyRoutes = facultySlugs.map((slug) => ({
    url: `${base}/faculty/${slug}`,
    lastModified,
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  return [...staticRoutes, ...courseRoutes, ...facultyRoutes];
}
