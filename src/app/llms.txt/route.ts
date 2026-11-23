import { db } from "@/lib/db";
import { publishedWhere } from "@/lib/posts";
import { absoluteUrl, postPath, siteConfig } from "@/lib/site";

export const revalidate = 3600;

export async function GET() {
  const [categories, posts, authors] = await Promise.all([
    db.category.findMany({ orderBy: { sortOrder: "asc" } }),
    db.post.findMany({
      where: publishedWhere({ noindex: false }),
      select: { slug: true, type: true, title: true, excerpt: true, categoryId: true, publishedAt: true },
      orderBy: { publishedAt: "desc" },
      take: 300,
    }),
    db.author.findMany({
      orderBy: { name: "asc" },
      select: { slug: true, name: true, jobTitle: true, expertise: true },
    }),
  ]);

  const lines: string[] = [
    `# ${siteConfig.name}`,
    "",
    `> ${siteConfig.description}`,
    "",
    `${siteConfig.name} (${siteConfig.domain}) is an independent English-language publication for controls engineers, system integrators, OT security practitioners and plant leaders. News articles report on industry developments and ICS/OT advisories; Insights are evergreen technical guides. Every article has a named author, publication and update dates, key takeaways, FAQs and primary cited sources.`,
    "",
    `Every article is also available as clean Markdown at \`${absoluteUrl("/md/{slug}")}\`.`,
    "",
    "## Core sections & machine-readable endpoints",
    "",
    `- [News](${absoluteUrl("/news")}): Industrial automation industry news, standards updates and OT cybersecurity advisories`,
    `- [Insights](${absoluteUrl("/blog")}): Evergreen technical guides and engineering comparisons`,
    `- [Topics](${absoluteUrl("/topics")}): All ${categories.length} industrial automation disciplines`,
    `- [Authors](${absoluteUrl("/authors")}): Editorial team and subject-matter expertise`,
    `- [About Induqora](${absoluteUrl("/about")}): Mission, audience and independence`,
    `- [Editorial policy](${absoluteUrl("/editorial-policy")}): Primary sourcing, fact-checking and corrections standards`,
    `- [Full-text corpus for LLMs](${absoluteUrl("/llms-full.txt")}): Complete Markdown text, takeaways, FAQs and sources of all recent articles`,
    `- [RSS 2.0 feed](${absoluteUrl("/rss.xml")}): Full-text XML feed`,
    `- [JSON Feed 1.1](${absoluteUrl("/feed.json")}): Structured JSON feed`,
    `- [XML Sitemap](${absoluteUrl("/sitemap.xml")}): Complete indexable URL inventory`,
    `- [Google News Sitemap](${absoluteUrl("/news-sitemap.xml")}): Recent 48-hour news stories`,
    "",
  ];

  if (authors.length) {
    lines.push("## Editorial team", "");
    for (const a of authors) {
      lines.push(`- [${a.name}](${absoluteUrl(`/author/${a.slug}`)})${a.jobTitle ? ` — ${a.jobTitle}` : ""}${a.expertise ? `: ${a.expertise}` : ""}`);
    }
    lines.push("");
  }

  for (const c of categories) {
    const inCat = posts.filter((p) => p.categoryId === c.id);
    if (!inCat.length) continue;
    lines.push(`## ${c.name}`, "");
    if (c.description) lines.push(`${c.description} ([Topic archive](${absoluteUrl(`/category/${c.slug}`)}))`, "");
    for (const p of inCat) {
      lines.push(`- [${p.title}](${absoluteUrl(postPath(p))}) ([Markdown](${absoluteUrl(`/md/${p.slug}`)})): ${p.excerpt}`);
    }
    lines.push("");
  }

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
