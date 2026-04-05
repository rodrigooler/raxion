import type { Metadata } from "next";
import { blogPosts } from "../../content/posts";
import { getSiteContent } from "../../content/site-dictionary";
import { PostIndexPage } from "../../components/post-index";
import { SiteFooter, SiteHeader } from "../../components/site-shell";

export const metadata: Metadata = {
  alternates: {
    canonical: "/zh/blog/",
  },
};

export default function Page() {
  const content = getSiteContent("zh");
  return <><SiteHeader locale="zh" content={content} /><PostIndexPage locale="zh" content={content} type="blog" posts={blogPosts} /><SiteFooter locale="zh" content={content} /></>;
}
