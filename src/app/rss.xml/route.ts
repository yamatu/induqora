import { feedPosts } from "@/lib/feeds";
import { absoluteUrl, postPath, siteConfig } from "@/lib/site";
import { escapeXml } from "@/lib/utils";

export const revalidate = 600;

function cdata(s: string) {
  return `<![CDATA[${s.replace(/]]>/g, "]]]]><![CDATA[>")}]]>`;
}

export async function GET() {
  const posts = await feedPosts();
  const items = posts
    .map((p) => {
      const url = absoluteUrl(postPath(p));
      return `    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${escapeXml(url)}</link>
      <guid isPermaLink="true">${escapeXml(url)}</guid>
      <pubDate>${p.publishedAt!.toUTCString()}</pubDate>
      <dc:creator>${escapeXml(p.author.name)}</dc:creator>
      <category>${escapeXml(p.category.name)}</category>
${p.tags.map((t) => `      <category>${escapeXml(t.name)}</category>`).join("\n")}
      <description>${escapeXml(p.excerpt)}</description>
      <content:encoded>${cdata(p.html)}</content:encoded>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${escapeXml(siteConfig.name)} — ${escapeXml(siteConfig.tagline)}</title>
    <link>${siteConfig.url}</link>
    <atom:link href="${absoluteUrl("/rss.xml")}" rel="self" type="application/rss+xml" />
    <description>${escapeXml(siteConfig.description)}</description>
    <language>en-us</language>
    <copyright>© ${new Date().getFullYear()} ${escapeXml(siteConfig.name)}</copyright>
    <lastBuildDate>${(posts[0]?.publishedAt ?? new Date()).toUTCString()}</lastBuildDate>
    <image>
      <url>${absoluteUrl("/logo.png")}</url>
      <title>${escapeXml(siteConfig.name)}</title>
      <link>${siteConfig.url}</link>
    </image>
${items}
  </channel>
</rss>`;

  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
