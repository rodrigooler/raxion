import type { Metadata } from "next";
import { headers } from "next/headers";
import type { ReactNode } from "react";
import "./globals.css";
import { SiteEffects } from "./site-effects";
import { normalizeLocale } from "../lib/site";

export const metadata: Metadata = {
  metadataBase: new URL("https://raxion.network"),
  title: "RAXION | The Blockchain That Thinks",
  description:
    "RAXION is the first sovereign blockchain that transforms intelligence from a service into a verifiable state.",
  applicationName: "RAXION",
  keywords: [
    "RAXION",
    "Sovereign SVM",
    "Solana rollup",
    "Proof of Inference Quality",
    "PoIQ",
    "Cognitive Finality",
    "zk-ML",
    "decentralized AI",
  ],
  alternates: {
    canonical: "/",
    languages: {
      en: "/",
      "pt-BR": "/pt-BR",
      zh: "/zh",
      ja: "/ja",
      es: "/es",
      "x-default": "/",
    },
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "RAXION",
    title: "RAXION | The Blockchain That Thinks",
    description:
      "RAXION is the first sovereign blockchain that transforms intelligence from a service into a verifiable state.",
    images: [
      {
        url: "/assets/og.webp",
        width: 1200,
        height: 630,
        alt: "RAXION - The Blockchain That Thinks",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RAXION | The Blockchain That Thinks",
    description:
      "RAXION is the first sovereign blockchain that transforms intelligence from a service into a verifiable state.",
    images: ["/assets/og.webp"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: [
      { url: "/assets/favicon.ico", sizes: "32x32", type: "image/x-icon" },
      { url: "/assets/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: ["/assets/favicon.ico"],
  },
  manifest: "/site.webmanifest",
  category: "technology",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const requestHeaders = await headers();
  const htmlLang = normalizeLocale(requestHeaders.get("x-site-locale") ?? undefined);

  return (
    <html lang={htmlLang} suppressHydrationWarning>
      <body className="overflow-x-hidden bg-black text-white selection:bg-brand-blue selection:text-black">
        <div className="grain" aria-hidden="true" />
        <div id="cursor-ring" className="cursor-ring hidden md:block" aria-hidden="true" />
        <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
          <div id="flare-1" className="lens-flare absolute -left-1/4 -top-1/4 h-[700px] w-[700px] from-brand-red/10 opacity-25 transition-transform duration-300" />
          <div id="flare-2" className="lens-flare absolute -bottom-1/4 -right-1/4 h-[700px] w-[700px] from-brand-blue/10 opacity-25 transition-transform duration-300" />
          <div className="lens-flare absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 from-brand-purple/5 opacity-20" />
        </div>
        {children}
        <SiteEffects />
      </body>
    </html>
  );
}
