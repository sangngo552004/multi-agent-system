import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://demo.careeros.com";

  return [
    {
      url: `${baseUrl}/vi/candidate`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/en/candidate`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    // We can add dynamic routes for jobs here by fetching from API
  ];
}
