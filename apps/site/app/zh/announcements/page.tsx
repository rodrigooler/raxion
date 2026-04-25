import type { Metadata } from "next";
import { announcementPosts } from "../../content/posts";
import { getSiteContent } from "../../content/site-dictionary";
import { PostIndexPage } from "../../components/post-index";
import { SiteFooter, SiteHeader } from "../../components/site-shell";

export const metadata: Metadata = {
  alternates: {
    canonical: "/zh/announcements/",
  },
};

export default function Page() {
  const content = getSiteContent("zh");
  return <><SiteHeader locale="zh" content={content} /><PostIndexPage locale="zh" content={content} type="announcement" posts={announcementPosts} /><SiteFooter locale="zh" content={content} /></>;
}
