import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { publishedWhere } from "@/lib/posts";
import { absoluteUrl, siteConfig } from "@/lib/site";

export const revalidate = 600;

const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "Bingbot",
  "Amazonbot",
  "MistralAI-User",
  "YouBot",
  "Cohere-ai",
  "CCBot",
  "Meta-ExternalAgent",
  "DuckAssistBot",
];

const disallow = ["/admin", "/api/", "/search"];

export default async function robots(): Promise<MetadataRoute.Robots> {
  const host = new URL(siteConfig.url).host;
  const sitemaps = [absoluteUrl("/sitemap.xml")];

  // A news sitemap may only list the last 48 hours, so it is empty most days. Advertising an
  // empty one makes Search Console report "no valid URLs" — list it only while it has entries.
  try {
    const since = new Date(Date.now() - 48 * 3600 * 1000);
    const freshNews = await db.post.count({
      where: publishedWhere({ type: "NEWS", noindex: false, publishedAt: { gte: since, lte: new Date() } }),
    });
    if (freshNews > 0) sitemaps.push(absoluteUrl("/news-sitemap.xml"));
  } catch {
    // Never fail robots.txt because of a database hiccup.
  }

  return {
    rules: [
      { userAgent: "*", allow: "/", disallow },
      { userAgent: AI_CRAWLERS, allow: "/", disallow },
    ],
    sitemap: sitemaps,
    host,
  };
}
