"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { localeBasePath, locales, type Locale } from "../../lib/site";
import type { SiteDictionary } from "../content/site-types";

const localeMeta: Record<Locale, { flag: string; shortLabel: string; code: string }> = {
  en: { flag: "🇺🇸", shortLabel: "English", code: "EN" },
  "pt-BR": { flag: "🇧🇷", shortLabel: "Portugues", code: "PT" },
  zh: { flag: "🇨🇳", shortLabel: "中文", code: "ZH" },
  ja: { flag: "🇯🇵", shortLabel: "日本語", code: "JA" },
  es: { flag: "🇪🇸", shortLabel: "Espanol", code: "ES" },
};

function GlobeIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2Zm6.93 9h-3.01a15.7 15.7 0 0 0-1.43-5.02A8.04 8.04 0 0 1 18.93 11ZM12 4.04c.83 1.2 1.8 3.42 2.24 6.96H9.76C10.2 7.46 11.17 5.24 12 4.04ZM4.26 13h3.02c.14 1.82.61 3.55 1.42 5.02A8.03 8.03 0 0 1 4.26 13Zm3.02-2H4.26a8.03 8.03 0 0 1 4.44-5.02A15.68 15.68 0 0 0 7.28 11Zm4.72 8.96c-.83-1.2-1.8-3.42-2.24-6.96h4.48c-.44 3.54-1.41 5.76-2.24 6.96ZM14.45 13h-4.9c-.15-1.18-.15-1.82 0-2h4.9c.15 1.18.15 1.82 0 2Zm.85 5.02A15.68 15.68 0 0 0 16.72 13h3.02a8.03 8.03 0 0 1-4.44 5.02Z"
        fill="currentColor"
      />
    </svg>
  );
}

function stripLocalePrefix(pathname: string): string {
  if (!pathname || pathname === "/") return "";

  for (const locale of locales) {
    if (locale === "en") continue;

    const prefix = `/${locale}`;
    if (pathname === prefix) return "";
    if (pathname.startsWith(`${prefix}/`)) return pathname.slice(prefix.length);
  }

  return pathname;
}

function buildLocalizedHref(pathname: string, locale: Locale): string {
  const basePath = localeBasePath(locale);
  const suffix = stripLocalePrefix(pathname);
  return `${basePath}${suffix}` || "/";
}

export function LocaleSwitcher({ locale, content }: Readonly<{ locale: Locale; content: SiteDictionary }>) {
  const pathname = usePathname() || "/";
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const activeLocale = localeMeta[locale];

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);
    globalThis.addEventListener("keydown", handleKey);

    return () => {
      document.removeEventListener("mousedown", handleClick);
      globalThis.removeEventListener("keydown", handleKey);
    };
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        aria-label={content.localeLabel}
        aria-expanded={open}
        className="flex items-center justify-between gap-2 border border-white/10 bg-black/80 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-gray-300 outline-none transition-colors duration-300 hover:border-white/30 focus:border-brand-blue sm:min-w-[178px] sm:gap-3"
        onClick={() => setOpen((current) => !current)}
      >
        <span className="flex items-center gap-2">
          <span className="text-brand-blue">
            <GlobeIcon />
          </span>
          <span className="hidden text-gray-500 sm:inline">{content.localeLabel}</span>
        </span>
        <span className="flex items-center gap-2">
          <span className="text-sm leading-none">{activeLocale.flag}</span>
          <span className="hidden sm:inline">{content.localeNames[locale] || activeLocale.shortLabel}</span>
          <span className="sm:hidden">{activeLocale.code}</span>
        </span>
        <span className={`text-[8px] text-gray-500 transition-transform duration-300 ${open ? "rotate-180" : ""}`}>▼</span>
      </button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-56 max-w-[calc(100vw-2rem)] overflow-hidden border border-white/10 bg-black/95 shadow-[0_18px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:min-w-full sm:w-auto">
          {locales.map((targetLocale) => {
            const target = localeMeta[targetLocale];
            const isActive = targetLocale === locale;

            return (
              <button
                key={targetLocale}
                type="button"
                className={`flex w-full items-center justify-between gap-4 border-b border-white/5 px-3 py-3 text-left font-mono text-[10px] uppercase tracking-[0.16em] transition-colors duration-300 last:border-b-0 ${
                  isActive ? "bg-brand-blue/10 text-white" : "text-gray-300 hover:bg-white/5 hover:text-white"
                }`}
                onClick={() => {
                  setOpen(false);
                  if (!isActive) {
                    globalThis.location.assign(buildLocalizedHref(pathname, targetLocale));
                  }
                }}
              >
                <span className="flex items-center gap-3">
                  <span className="text-sm leading-none">{target.flag}</span>
                  <span>{content.localeNames[targetLocale] || target.shortLabel}</span>
                </span>
                <span className={`text-[9px] ${isActive ? "text-brand-blue" : "text-gray-600"}`}>
                  {target.code}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
