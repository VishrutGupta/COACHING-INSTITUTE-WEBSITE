import type { MetadataRoute } from "next";
import { defaultInstituteSlug } from "@/lib/data/settings";

function siteUrl(): string {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ||
    `https://${defaultInstituteSlug()}.example.com`;
  return base.replace(/\/+$/, "");
}

export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
