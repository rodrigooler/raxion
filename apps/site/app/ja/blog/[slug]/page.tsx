import { notFound } from "next/navigation";
import { findBlogPost } from "../../../content/posts";
import { getSiteContent } from "../../../content/site-dictionary";
import { PostPage } from "../../../components/post-pages";
import { SiteFooter, SiteHeader } from "../../../components/site-shell";

export default function Page({ params }: { params: { slug: string } }) {
  const post = findBlogPost(params.slug);
  if (!post) notFound();
  const content = getSiteContent("ja");
  return <><SiteHeader locale="ja" content={content} /><PostPage locale="ja" content={content} post={post} /><SiteFooter locale="ja" content={content} /></>;
}
