import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/vi/candidate/", "/en/candidate/"],
        disallow: ["/vi/admin/", "/en/admin/", "/vi/hr/", "/en/hr/", "/vi/auth/", "/en/auth/"],
      },
    ],
    sitemap: "https://demo.careeros.com/sitemap.xml",
  };
}
