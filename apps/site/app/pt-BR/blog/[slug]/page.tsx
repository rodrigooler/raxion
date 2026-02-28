import { notFound } from "next/navigation";
import { findBlogPost } from "../../../content/posts";
import { getSiteContent } from "../../../content/site-dictionary";
import { PostPage } from "../../../components/post-pages";
import { SiteFooter, SiteHeader } from "../../../components/site-shell";

export default function Page({ params }: Readonly<{ params: { slug: string } }>) {
  const post = findBlogPost(params.slug);
  if (!post) notFound();
  const content = getSiteContent("pt-BR");
  return <><SiteHeader locale="pt-BR" content={content} /><PostPage locale="pt-BR" content={content} post={post} /><SiteFooter locale="pt-BR" content={content} /></>;
}
