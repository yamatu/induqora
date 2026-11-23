import { db } from "@/lib/db";
import { publishedWhere } from "@/lib/posts";
import { effectiveModifiedDate } from "@/lib/seo";
import { absoluteUrl, postPath, siteConfig } from "@/lib/site";
import { parseJsonArray, parseLines, type Faq, type Source } from "@/lib/utils";

export const revalidate = 3600;

export async function GET() {
  const posts = await db.post.findMany({
    where: publishedWhere({ noindex: false }),
    include: { author: true, category: true, tags: true },
    orderBy: { publishedAt: "desc" },
    take: 100,
  });

  const parts = [`# ${siteConfig.name} — full article text`, "", `> ${siteConfig.description}`, ""];

  for (const p of posts) {
    const takeaways = parseLines(p.keyTakeaways);
    const faqs = parseJsonArray<Faq>(p.faqs);
    const sources = parseJsonArray<Source>(p.sources);
    const modified = effectiveModifiedDate(p);
    parts.push(
      "---",
      "",
      `# ${p.title}`,
      "",
      `URL: ${absoluteUrl(postPath(p))}`,
      `Markdown: ${absoluteUrl(`/md/${p.slug}`)}`,
      `Type: ${p.type === "NEWS" ? "News" : "Insight"} | Topic: ${p.category.name}`,
      `Author: ${p.author.name}${p.author.jobTitle ? `, ${p.author.jobTitle}` : ""}`,
      `Published: ${p.publishedAt?.toISOString().slice(0, 10)} | Updated: ${modified.toISOString().slice(0, 10)}`,
      p.tags.length ? `Tags: ${p.tags.map((t) => t.name).join(", ")}` : "",
      "",
      p.excerpt,
      "",
    );
    if (takeaways.length) parts.push("## Key takeaways", "", ...takeaways.map((t) => `- ${t}`), "");
    parts.push(p.content.trim(), "");
    if (faqs.length) parts.push("## Frequently asked questions", "", ...faqs.flatMap((f) => [`### ${f.q}`, "", f.a, ""]));
    if (sources.length) parts.push("## Sources", "", ...sources.map((s) => `- ${s.title}${s.url ? `: ${s.url}` : ""}`), "");
  }

  return new Response(parts.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
