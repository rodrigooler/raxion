import type { Post } from "../content/posts";
import { formatLocalizedDate, localeBasePath, type Locale } from "../../lib/site";
import type { SiteDictionary } from "../content/site-types";

export function PostIndexPage({
  locale,
  content,
  type,
  posts,
}: {
  locale: Locale;
  content: SiteDictionary;
  type: "announcement" | "blog";
  posts: Post[];
}) {
  const basePath = localeBasePath(locale);
  const title = type === "announcement" ? content.post.visitAnnouncements : content.post.visitBlog;
  const eyebrow = type === "announcement" ? content.announcementLabel : content.post.blogLabel;

  return (
    <main className="relative z-10 px-4 pb-20 pt-40 sm:px-6 sm:pb-24 sm:pt-44">
      <div className="mx-auto max-w-[1200px]">
        <div className="reveal mb-12">
          <a href={basePath || "/"} className="mb-6 inline-flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.25em] text-gray-500 transition-colors duration-300 hover:text-brand-blue">
            <span>{"<-"}</span>
            {content.post.backToHome}
          </a>
          <div className="mb-4 font-mono text-[10px] uppercase tracking-[0.3em] text-brand-blue">{eyebrow}</div>
          <h1 className="font-display text-4xl font-black tracking-tighter sm:text-5xl lg:text-7xl">{title}</h1>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {posts.map((post) => (
            <a
              key={post.slug}
              href={`${basePath}/${type === "announcement" ? "announcements" : "blog"}/${post.slug}`}
              className="reveal block border border-white/10 bg-white/[0.02] p-6 transition-colors duration-300 hover:border-brand-blue/40 hover:bg-white/[0.04] sm:p-8"
            >
              <div className="mb-3 font-mono text-[10px] uppercase tracking-widest text-gray-600">{formatLocalizedDate(post.date, locale)}</div>
              <div className="mb-4 font-display text-2xl font-black tracking-tight sm:text-3xl">{post.title[locale]}</div>
              <p className="text-sm leading-relaxed text-gray-500">{post.summary[locale]}</p>
            </a>
          ))}
        </div>
      </div>
    </main>
  );
}
