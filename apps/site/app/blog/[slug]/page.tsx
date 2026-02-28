import { notFound } from "next/navigation";
import { findBlogPost } from "../../content/posts";
import { getSiteContent } from "../../content/site-dictionary";
import { PostPage } from "../../components/post-pages";
import { SiteFooter, SiteHeader } from "../../components/site-shell";

export default function Page({ params }: { params: { slug: string } }) {
  const post = findBlogPost(params.slug);
  if (!post) notFound();
  const content = getSiteContent("en");
  return <><SiteHeader locale="en" content={content} /><PostPage locale="en" content={content} post={post} /><SiteFooter locale="en" content={content} /></>;
}
