import { db } from "@/lib/db";
import { publishedWhere } from "@/lib/posts";
import { absoluteUrl, postPath, siteConfig } from "@/lib/site";

export const revalidate = 3600;

export async function GET() {
  const [categories, posts] = await Promise.all([
    db.category.findMany({ orderBy: { sortOrder: "asc" } }),
    db.post.findMany({
      where: publishedWhere({ noindex: false }),
      select: { slug: true, type: true, title: true, excerpt: true, categoryId: true },
      orderBy: { publishedAt: "desc" },
      take: 300,
    }),
  ]);

  const lines: string[] = [
    `# ${siteConfig.name}`,
    "",
    `> ${siteConfig.description}`,
    "",
    `${siteConfig.name} (${siteConfig.domain}) is an English-language publication for controls engineers, system integrators, OT security practitioners and plant leaders. News articles report on industry developments; Insights are evergreen technical guides. Every article has a named author, publication and update dates, key takeaways and cited sources.`,
    "",
    "## Site sections",
    "",
    `- [News](${absoluteUrl("/news")}): Industrial automation industry news and analysis`,
    `- [Insights](${absoluteUrl("/blog")}): Technical guides and explainers`,
    `- [Topics](${absoluteUrl("/topics")}): All coverage grouped by discipline`,
    `- [Editorial policy](${absoluteUrl("/editorial-policy")}): Sourcing, fact-checking and corrections standards`,
    `- [Full-text content for LLMs](${absoluteUrl("/llms-full.txt")}): Complete text of recent articles in Markdown`,
    `- [RSS feed](${absoluteUrl("/rss.xml")})`,
    "",
  ];

  for (const c of categories) {
    const inCat = posts.filter((p) => p.categoryId === c.id);
    if (!inCat.length) continue;
    lines.push(`## ${c.name}`, "");
    if (c.description) lines.push(c.description, "");
    for (const p of inCat) lines.push(`- [${p.title}](${absoluteUrl(postPath(p))}): ${p.excerpt}`);
    lines.push("");
  }

  return new Response(lines.join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
