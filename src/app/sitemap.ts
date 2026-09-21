import type { MetadataRoute } from "next";
import { allLessons, allProjects, references, tracks } from "@/lib/curriculum";
import { site } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const pages: MetadataRoute.Sitemap = [
    "",
    "/tutorials",
    "/projects",
    "/exercises",
    "/quiz",
    "/certificates",
    "/reference",
    "/jobs",
    "/about",
    "/path",
    "/advertise",
    "/privacy",
    "/terms",
  ].map((path) => ({
    url: `${site.domain}${path}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.7,
  }));

  for (const t of tracks) {
    pages.push({
      url: `${site.domain}/tutorials/${t.slug}`,
      lastModified: now,
      priority: 0.8,
    });
  }
  for (const l of allLessons()) {
    pages.push({
      url: `${site.domain}/tutorials/${l.track}/${l.slug}`,
      lastModified: now,
      priority: 0.9,
    });
  }
  for (const p of allProjects) {
    pages.push({
      url: `${site.domain}/projects/${p.slug}`,
      lastModified: now,
      priority: 0.8,
    });
    for (const part of p.parts) {
      pages.push({
        url: `${site.domain}/projects/${p.slug}/${part.slug}`,
        lastModified: now,
        priority: 0.75,
      });
    }
  }
  for (const r of references) {
    pages.push({
      url: `${site.domain}/reference/${r.slug}`,
      lastModified: now,
      priority: 0.6,
    });
  }
  return pages;
}
