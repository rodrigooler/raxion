import { latestAnnouncement } from "../content/posts";
import { localeBasePath, type Locale } from "../../lib/site";
import type { SiteDictionary } from "../content/site-types";
import { LocaleSwitcher } from "./locale-switcher";

export function SiteHeader({ locale, content }: Readonly<{ locale: Locale; content: SiteDictionary }>) {
  const basePath = localeBasePath(locale);
  const homeHref = basePath || "/";
  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <a
        href={`${basePath}/announcements/${latestAnnouncement.slug}`}
        className="block w-full border-b border-brand-blue/30 bg-black/95 transition-colors duration-300 hover:bg-brand-blue/10"
      >
        <div className="mx-auto flex max-w-[1800px] items-center justify-center gap-2 px-4 py-3 text-center font-mono text-[9px] uppercase tracking-[0.18em] text-brand-blue sm:gap-3 sm:text-[11px] sm:tracking-[0.22em]">
          <span className="hidden text-white/40 sm:inline">{content.latestAnnouncementEyebrow}</span>
          <span className="truncate">{latestAnnouncement.title[locale]}</span>
        </div>
      </a>
      <div className="border-b border-white/5 bg-black/85 px-4 py-3 backdrop-blur-xl sm:px-6 sm:py-4">
        <div className="mx-auto flex max-w-[1800px] items-center justify-between gap-3 sm:gap-6">
          <a href={homeHref} className="font-display text-2xl font-black tracking-tighter mix-blend-difference sm:text-3xl">RAXION.</a>
          <nav className="hidden gap-12 font-mono text-[10px] uppercase tracking-[0.3em] text-gray-400 lg:flex">
            {content.nav.map((item, index) => (
              <a key={item.href} href={`${homeHref}${item.href}`} className={`transition-colors duration-300 ${index === 0 ? "hover:text-brand-red" : "hover:text-brand-blue"}`}>{item.label}</a>
            ))}
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href={`${basePath}/blog`}
              className="hidden border border-white/10 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-gray-300 transition-colors duration-300 hover:border-white/30 hover:text-white md:inline-flex"
            >
              {content.post.blogLabel}
            </a>
            <a
              href={`${basePath}/announcements`}
              className="hidden border border-white/10 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-gray-300 transition-colors duration-300 hover:border-white/30 hover:text-white md:inline-flex"
            >
              {content.post.announcementsLabel}
            </a>
            <LocaleSwitcher locale={locale} content={content} />
            <details className="relative lg:hidden">
              <summary className="list-none cursor-pointer border border-white/10 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-gray-300 transition-colors duration-300 hover:border-white/30 hover:text-white [&::-webkit-details-marker]:hidden">
                {content.menuLabel}
              </summary>
              <div className="absolute right-0 top-[calc(100%+0.5rem)] w-[min(19rem,calc(100vw-2rem))] border border-white/10 bg-black/95 p-4 shadow-[0_18px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl">
                <div className="grid gap-2">
                  {content.nav.map((item) => (
                    <a
                      key={item.href}
                      href={`${homeHref}${item.href}`}
                      className="border border-white/8 px-3 py-3 font-mono text-[10px] uppercase tracking-[0.16em] text-gray-300 transition-colors duration-300 hover:border-white/25 hover:text-white"
                    >
                      {item.label}
                    </a>
                  ))}
                </div>
                <div className="mt-3 grid gap-2 border-t border-white/8 pt-3">
                  <a
                    href={`${basePath}/blog`}
                    className="border border-white/8 px-3 py-3 font-mono text-[10px] uppercase tracking-[0.16em] text-gray-300 transition-colors duration-300 hover:border-white/25 hover:text-white"
                  >
                    {content.post.blogLabel}
                  </a>
                  <a
                    href={`${basePath}/announcements`}
                    className="border border-white/8 px-3 py-3 font-mono text-[10px] uppercase tracking-[0.16em] text-gray-300 transition-colors duration-300 hover:border-white/25 hover:text-white"
                  >
                    {content.post.announcementsLabel}
                  </a>
                </div>
              </div>
            </details>
          </div>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter({ locale, content }: Readonly<{ locale: Locale; content: SiteDictionary }>) {
  const basePath = localeBasePath(locale);
  return (
    <footer className="border-t border-white/5 px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto flex max-w-[1400px] flex-col items-center justify-between gap-6 md:flex-row md:gap-8">
        <div className="font-display text-2xl font-black tracking-tight">RAXION</div>
        <div className="text-center font-mono text-[9px] uppercase tracking-[0.32em] text-gray-700 md:text-left md:tracking-[0.4em]">{content.footer}</div>
        <div className="flex gap-3">
          <a href={`${basePath}/blog`} className="flex h-10 w-10 items-center justify-center border border-white/10 bg-white/5 font-mono text-[10px] transition-all duration-300 hover:border-brand-blue hover:text-brand-blue">BL</a>
          <a href="https://github.com/rodrigooler/raxion" target="_blank" rel="noreferrer" className="flex h-10 w-10 items-center justify-center border border-white/10 bg-white/5 font-mono text-[10px] transition-all duration-300 hover:border-brand-blue hover:text-brand-blue">GH</a>
          <a href="https://github.com/rodrigooler/raxion/blob/main/WHITEPAPER.md" target="_blank" rel="noreferrer" className="flex h-10 w-10 items-center justify-center border border-white/10 bg-white/5 font-mono text-[10px] transition-all duration-300 hover:border-brand-purple hover:text-brand-purple">WP</a>
        </div>
      </div>
    </footer>
  );
}
