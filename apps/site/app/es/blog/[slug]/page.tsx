import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { findBlogPost, getStaticPostParams } from "../../../content/posts";
import { getSiteContent } from "../../../content/site-dictionary";
import { PostPage } from "../../../components/post-pages";
import { SiteFooter, SiteHeader } from "../../../components/site-shell";
import { routeHref } from "../../../../lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return getStaticPostParams("blog");
}

export async function generateMetadata({ params }: Readonly<{ params: Promise<{ slug: string }> }>): Promise<Metadata> {
  const { slug } = await params;
  const canonical = routeHref("/es", `/blog/${slug}`);
  return {
    alternates: {
      canonical,
    },
    openGraph: {
      url: canonical,
    },
  };
}

export default async function Page({ params }: Readonly<{ params: Promise<{ slug: string }> }>) {
  const { slug } = await params;
  const post = findBlogPost(slug);
  if (!post) notFound();
  const content = getSiteContent("es");
  return <><SiteHeader locale="es" content={content} /><PostPage locale="es" content={content} post={post} /><SiteFooter locale="es" content={content} /></>;
}
