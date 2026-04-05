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

export async function generateMetadata({ params }: Readonly<{ params: Promise<{ slug: string }> }>): Promise<Metadata> {
  const { slug } = await params;
  const canonical = routeHref("/pt-BR", `/announcements/${slug}`);
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
  const post = findAnnouncement(slug);
  if (!post) notFound();
  const content = getSiteContent("pt-BR");
  return <><SiteHeader locale="pt-BR" content={content} /><PostPage locale="pt-BR" content={content} post={post} /><SiteFooter locale="pt-BR" content={content} /></>;
}
