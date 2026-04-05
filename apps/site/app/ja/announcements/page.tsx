import type { Metadata } from "next";
import { announcementPosts } from "../../content/posts";
import { getSiteContent } from "../../content/site-dictionary";
import { PostIndexPage } from "../../components/post-index";
import { SiteFooter, SiteHeader } from "../../components/site-shell";

export const metadata: Metadata = {
  alternates: {
    canonical: "/ja/announcements/",
  },
};

export default function Page() {
  const content = getSiteContent("ja");
  return <><SiteHeader locale="ja" content={content} /><PostIndexPage locale="ja" content={content} type="announcement" posts={announcementPosts} /><SiteFooter locale="ja" content={content} /></>;
}
