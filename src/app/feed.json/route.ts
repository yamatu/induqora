import { feedPosts } from "@/lib/feeds";
import { absoluteUrl, postPath, siteConfig } from "@/lib/site";

export const revalidate = 600;

export async function GET() {
  const posts = await feedPosts();
  const feed = {
    version: "https://jsonfeed.org/version/1.1",
    title: siteConfig.name,
    home_page_url: siteConfig.url,
    feed_url: absoluteUrl("/feed.json"),
    description: siteConfig.description,
    icon: absoluteUrl("/logo.png"),
    language: "en-US",
    items: posts.map((p) => ({
      id: absoluteUrl(postPath(p)),
      url: absoluteUrl(postPath(p)),
      title: p.title,
      summary: p.excerpt,
      content_html: p.html,
      image: absoluteUrl(p.coverImage || `/og/${p.slug}`),
      date_published: p.publishedAt?.toISOString(),
      date_modified: p.modifiedAt.toISOString(),
      authors: [{ name: p.author.name, url: absoluteUrl(`/author/${p.author.slug}`) }],
      tags: [p.category.name, ...p.tags.map((t) => t.name)],
    })),
  };
  return Response.json(feed, { headers: { "Content-Type": "application/feed+json; charset=utf-8" } });
}
