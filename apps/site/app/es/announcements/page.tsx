import type { Metadata } from "next";
import { announcementPosts } from "../../content/posts";
import { getSiteContent } from "../../content/site-dictionary";
import { PostIndexPage } from "../../components/post-index";
import { SiteFooter, SiteHeader } from "../../components/site-shell";

export const metadata: Metadata = {
  alternates: {
    canonical: "/es/announcements/",
  },
};

export default function Page() {
  const content = getSiteContent("es");
  return <><SiteHeader locale="es" content={content} /><PostIndexPage locale="es" content={content} type="announcement" posts={announcementPosts} /><SiteFooter locale="es" content={content} /></>;
}
