import { db } from "@/lib/db";
import { publishedWhere } from "@/lib/posts";
import { absoluteUrl, postPath, siteConfig } from "@/lib/site";
import { escapeXml } from "@/lib/utils";

export const revalidate = 600;

// Google News sitemaps must only list articles published in the last 48 hours.
export async function GET() {
  const since = new Date(Date.now() - 48 * 3600 * 1000);
  const posts = await db.post.findMany({
    where: publishedWhere({ type: "NEWS", noindex: false, publishedAt: { gte: since, lte: new Date() } }),
    select: { slug: true, type: true, title: true, publishedAt: true },
    orderBy: { publishedAt: "desc" },
    take: 1000,
  });

  // An empty sitemap is an error in Search Console. 404 tells crawlers to drop it until the
  // next news post lands, and robots.txt stops advertising it in the meantime.
  if (posts.length === 0) {
    return new Response("No news articles within the last 48 hours", { status: 404 });
  }

  const items = posts
    .map(
      (p) => `  <url>
    <loc>${escapeXml(absoluteUrl(postPath(p)))}</loc>
    <news:news>
      <news:publication>
        <news:name>${escapeXml(siteConfig.name)}</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${p.publishedAt!.toISOString()}</news:publication_date>
      <news:title>${escapeXml(p.title)}</news:title>
    </news:news>
  </url>`,
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${items}
</urlset>`;

  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
