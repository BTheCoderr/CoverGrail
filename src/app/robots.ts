import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://covergrail.netlify.app";
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/dashboard", "/scans", "/collection", "/account", "/feedback"],
    },
    sitemap: `${base.replace(/\/$/, "")}/sitemap.xml`,
  };
}
