import type { MetadataRoute } from "next";
import { allPosts } from "./content/posts";
import { absoluteUrl, localeBasePath, locales, routeHref } from "../lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    const basePath = localeBasePath(locale);

    routes.push(
      { url: absoluteUrl(routeHref(basePath, "/")) },
      { url: absoluteUrl(routeHref(basePath, "/blog")) },
      { url: absoluteUrl(routeHref(basePath, "/announcements")) },
    );

    for (const post of allPosts) {
      const postPath = routeHref(basePath, `/${post.type === "announcement" ? "announcements" : "blog"}/${post.slug}`);
      routes.push({
        url: absoluteUrl(postPath),
        lastModified: new Date(post.date),
      });
    }
  }

  return routes;
}
