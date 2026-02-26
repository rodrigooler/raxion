import landingHtml from "../source/site.html?raw";

export async function GET(): Promise<Response> {
  return new Response(landingHtml, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=0, must-revalidate",
    },
  });
}
