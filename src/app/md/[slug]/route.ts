import { db } from "@/lib/db";
import { publishedWhere } from "@/lib/posts";
import { effectiveModifiedDate } from "@/lib/seo";
import { absoluteUrl, postPath, siteConfig } from "@/lib/site";
import { parseJsonArray, parseLines, type Faq, type Source } from "@/lib/utils";

export const revalidate = 3600;

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await db.post.findFirst({
    where: publishedWhere({ slug: decodeURIComponent(slug), noindex: false }),
    include: { author: true, category: true, tags: true },
  });

  if (!post) {
    return new Response("Article not found\n", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const takeaways = parseLines(post.keyTakeaways);
  const faqs = parseJsonArray<Faq>(post.faqs).filter((f) => f.q && f.a);
  const sources = parseJsonArray<Source>(post.sources).filter((s) => s.title);
  const canonical = absoluteUrl(postPath(post));
  const modified = effectiveModifiedDate(post);

  const lines: string[] = [
    "---",
    `title: ${JSON.stringify(post.title)}`,
    `url: ${canonical}`,
    `publication: ${siteConfig.name}`,
    `type: ${post.type === "NEWS" ? "News" : "Insight"}`,
    `category: ${post.category.name}`,
    `author: ${post.author.name}${post.author.jobTitle ? ` (${post.author.jobTitle})` : ""}`,
    `author_url: ${absoluteUrl(`/author/${post.author.slug}`)}`,
    `published: ${post.publishedAt?.toISOString().slice(0, 10) ?? ""}`,
    `updated: ${modified.toISOString().slice(0, 10)}`,
    `reading_minutes: ${post.readingMinutes}`,
    ...(post.tags.length ? [`tags: [${post.tags.map((t) => JSON.stringify(t.name)).join(", ")}]`] : []),
    "---",
    "",
    `# ${post.title}`,
    "",
    `> ${post.excerpt}`,
    "",
  ];

  if (takeaways.length) {
    lines.push("## Key takeaways", "", ...takeaways.map((t) => `- ${t}`), "");
  }

  lines.push(post.content.trim(), "");

  if (faqs.length) {
    lines.push("## Frequently asked questions", "");
    for (const f of faqs) {
      lines.push(`### ${f.q}`, "", f.a, "");
    }
  }

  if (sources.length) {
    lines.push("## Sources and further reading", "");
    for (const s of sources) {
      lines.push(s.url ? `- [${s.title}](${s.url})` : `- ${s.title}`);
    }
    lines.push("");
  }

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      "X-Robots-Tag": "noindex, follow",
      Link: `<${canonical}>; rel="canonical"`,
    },
  });
}
