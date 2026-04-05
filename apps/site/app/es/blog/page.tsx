import type { Metadata } from "next";
import { blogPosts } from "../../content/posts";
import { getSiteContent } from "../../content/site-dictionary";
import { PostIndexPage } from "../../components/post-index";
import { SiteFooter, SiteHeader } from "../../components/site-shell";

export const metadata: Metadata = {
  alternates: {
    canonical: "/es/blog/",
  },
};

export default function Page() {
  const content = getSiteContent("es");
  return <><SiteHeader locale="es" content={content} /><PostIndexPage locale="es" content={content} type="blog" posts={blogPosts} /><SiteFooter locale="es" content={content} /></>;
}
