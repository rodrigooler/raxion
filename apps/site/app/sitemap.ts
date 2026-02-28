import type { MetadataRoute } from "next";
import { allPosts } from "./content/posts";
import { localeBasePath, locales } from "../lib/site";

const siteUrl = "https://raxion.network";

function buildUrl(path: string): string {
  return new URL(path || "/", siteUrl).toString();
}

export default function sitemap(): MetadataRoute.Sitemap {
  const routes: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    const basePath = localeBasePath(locale);

    routes.push(
      { url: buildUrl(basePath || "/") },
      { url: buildUrl(`${basePath}/blog`) },
      { url: buildUrl(`${basePath}/announcements`) },
    );

    for (const post of allPosts) {
      const postPath = `${basePath}/${post.type === "announcement" ? "announcements" : "blog"}/${post.slug}`;
      routes.push({
        url: buildUrl(postPath),
        lastModified: new Date(post.date),
      });
    }
  }

  return routes;
}
