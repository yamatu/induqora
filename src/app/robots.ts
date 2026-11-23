import type { MetadataRoute } from "next";
import { absoluteUrl, siteConfig } from "@/lib/site";

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

export default function robots(): MetadataRoute.Robots {
  const host = new URL(siteConfig.url).host;
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow },
      { userAgent: AI_CRAWLERS, allow: "/", disallow },
    ],
    sitemap: [absoluteUrl("/sitemap.xml"), absoluteUrl("/news-sitemap.xml")],
    host,
  };
}
