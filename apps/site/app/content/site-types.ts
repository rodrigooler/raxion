import type { Locale } from "../../lib/site";

export type SiteDictionary = {
  nav: Array<{ href: string; label: string }>;
  menuLabel: string;
  announcementLabel: string;
  readAnnouncement: string;
  latestAnnouncementEyebrow: string;
  heroBadge: string;
  heroLines: [string, string, string, string];
  heroOrb: { title: string; subtitle: string };
  heroCtas: { primary: string; secondary: string };
  heroNotes: [string, string];
  marqueeItems: string[];
  metrics: Array<{ value: string; suffix: string; label: string; sublabel: string; accent?: string }>;
  problem: {
    eyebrow: string;
    titleTop: string;
    titleAccent: string;
    beforeLabel: string;
    afterLabel: string;
    intro: string;
    structuralEyebrow: string;
    structuralTitle: string;
    structuralAccent: string;
    structuralBody: string;
    structuralBody2: string;
    chainLabel: string;
    trustSteps: string[];
  };
  architecture: {
    title: string;
    titleAccent: string;
    summary: string;
    cards: Array<{ title: string; heading: string; body: string; accent: string }>;
    proofTitle: string;
    proofItems: Array<{ title: string; body: string; accent?: string }>;
    economicsEyebrow: string;
    economicsTitle: string;
    economicsLines: Array<{ label: string; expression: string; accent: string }>;
  };
  roadmap: {
    eyebrow: string;
    titleTop: string;
    titleAccent: string;
    titleBottom: string;
    phases: Array<{ label: string; date: string; title: string; accent: string; accentClass: string; active: boolean; items: string[] }>;
  };
  whitepaper: {
    eyebrow: string;
    title: string;
    body: string;
    ctas: { primary: string; secondary: string };
  };
  footer: string;
  post: {
    backToHome: string;
    authorLabel: string;
    publishedLabel: string;
    relatedLabel: string;
    blogLabel: string;
    announcementsLabel: string;
    visitBlog: string;
    visitAnnouncements: string;
  };
  localeLabel: string;
  localeNames: Record<Locale, string>;
};
