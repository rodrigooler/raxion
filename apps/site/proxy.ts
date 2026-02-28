import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, locales, type Locale } from "./lib/site";

function detectLocale(pathname: string): Locale {
  for (const locale of locales) {
    if (locale === defaultLocale) continue;

    if (pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)) {
      return locale;
    }
  }

  return defaultLocale;
}

export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-site-locale", detectLocale(request.nextUrl.pathname));

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const proxy = middleware;
export default middleware;

export const config = {
  matcher: ["/((?!_next|assets|favicon.ico|site.webmanifest|robots.txt|sitemap.xml).*)"],
};
