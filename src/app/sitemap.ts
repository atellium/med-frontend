import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://mednearby.in";

  const pages = [
    "/kolkata/garia/doctors",
    "/kolkata/garia/pharmacies",
    "/kolkata/garia/clinics",
  ];

  return pages.map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 0.8,
  }));
}