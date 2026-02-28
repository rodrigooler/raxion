import type { Locale } from "../../lib/site";
import { getSiteContent } from "../content/site-dictionary";
import { ArchitectureSection, HeroSection, Marquee, ProblemSection, RoadmapSection, WhitepaperSection } from "./home-sections";
import { SiteFooter, SiteHeader } from "./site-shell";

export function HomePage({ locale }: { locale: Locale }) {
  const content = getSiteContent(locale);
  return (
    <>
      <SiteHeader locale={locale} content={content} />
      <main className="relative z-10">
        <HeroSection locale={locale} content={content} />
        <Marquee content={content} />
        <ProblemSection locale={locale} content={content} />
        <ArchitectureSection content={content} />
        <RoadmapSection content={content} />
        <WhitepaperSection content={content} />
      </main>
      <SiteFooter locale={locale} content={content} />
    </>
  );
}
