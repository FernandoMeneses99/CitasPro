import type { MetadataRoute } from "next";

import { getAppUrl } from "@/lib/app-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getAppUrl();
  return [
    {
      url: base,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${base}/login`,
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${base}/register`,
      changeFrequency: "yearly",
      priority: 0.8,
    },
  ];
}