export const locales = ["en", "pt-BR", "zh", "ja", "es"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export function isSupportedLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function normalizeLocale(value?: string): Locale {
  if (!value) return defaultLocale;
  return isSupportedLocale(value) ? value : defaultLocale;
}

export function localeBasePath(locale: Locale): string {
  return locale === defaultLocale ? "" : `/${locale}`;
}

export type LocalizedText = Record<Locale, string>;

export function pickLocalized<T extends string | string[]>(value: Record<Locale, T>, locale: Locale): T {
  return value[locale] ?? value[defaultLocale];
}

export function formatLocalizedDate(date: string, locale: Locale): string {
  const tag = locale === "pt-BR" ? "pt-BR" : locale;
  const [year, month, day] = date.split("-").map(Number);
  const parsed = new Date(year, (month ?? 1) - 1, day ?? 1);
  return new Intl.DateTimeFormat(tag, { year: "numeric", month: "long", day: "numeric" }).format(parsed);
}

export const localeLabels: Record<Locale, string> = {
  en: "EN",
  "pt-BR": "PT",
  zh: "中文",
  ja: "日本語",
  es: "ES",
};
