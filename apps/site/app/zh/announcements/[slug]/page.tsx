import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { findAnnouncement } from "../../../content/posts";
import { getStaticPostParams } from "../../../content/posts";
import { getSiteContent } from "../../../content/site-dictionary";
import { PostPage } from "../../../components/post-pages";
import { SiteFooter, SiteHeader } from "../../../components/site-shell";
import { routeHref } from "../../../../lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return getStaticPostParams("announcement");
}

export function generateMetadata({ params }: Readonly<{ params: { slug: string } }>): Metadata {
  return {
    alternates: {
      canonical: routeHref("/zh", `/announcements/${params.slug}`),
    },
  };
}

export default function Page({ params }: Readonly<{ params: { slug: string } }>) {
  const post = findAnnouncement(params.slug);
  if (!post) notFound();
  const content = getSiteContent("zh");
  return <><SiteHeader locale="zh" content={content} /><PostPage locale="zh" content={content} post={post} /><SiteFooter locale="zh" content={content} /></>;
}
