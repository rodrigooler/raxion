import type { Locale } from "../../lib/site";
import { locales } from "../../lib/site";
import siteDictionaryData from "./site-dictionary.data.json";
import type { SiteDictionary } from "./site-types";

type SiteDictionaryPayload = {
  siteContent: Record<Locale, SiteDictionary>;
  homeUseCases: Record<Locale, Array<[string, string, string]>>;
  availableLocales: Locale[];
};

const payload = siteDictionaryData as SiteDictionaryPayload;

export const siteContent: Record<Locale, SiteDictionary> = payload.siteContent;
export const homeUseCases: Record<Locale, Array<[string, string, string]>> =
  payload.homeUseCases;
export const availableLocales = payload.availableLocales.length
  ? payload.availableLocales
  : locales;

export function getSiteContent(locale: Locale): SiteDictionary {
  return siteContent[locale];
}

export function getHomeUseCases(locale: Locale): Array<[string, string, string]> {
  return homeUseCases[locale];
}
