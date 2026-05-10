import type { MetadataRoute } from "next";
import { storefront } from "@/lib/storefront";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/admin/", "/api/", "/search", "/*?*"],
    },
    sitemap: `${storefront.siteUrl}/sitemap.xml`,
    host: storefront.siteUrl,
  };
}
