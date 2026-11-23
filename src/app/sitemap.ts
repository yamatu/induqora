import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { publishedWhere } from "@/lib/posts";
import { absoluteUrl, postPath } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, categories, tags, authors] = await Promise.all([
    db.post.findMany({
      where: publishedWhere({ noindex: false, canonicalUrl: "" }),
      select: { slug: true, type: true, modifiedAt: true, publishedAt: true, coverImage: true },
      orderBy: { publishedAt: "desc" },
    }),
    db.category.findMany({
      select: { slug: true, posts: { where: publishedWhere(), select: { modifiedAt: true }, orderBy: { modifiedAt: "desc" }, take: 1 } },
    }),
    db.tag.findMany({
      select: { slug: true, _count: { select: { posts: { where: publishedWhere() } } } },
    }),
    db.author.findMany({ select: { slug: true, _count: { select: { posts: { where: publishedWhere() } } } } }),
  ]);

  const latest = posts[0]?.modifiedAt ?? new Date();
  const latestOf = (type: string) => posts.find((p) => p.type === type)?.modifiedAt ?? latest;

  const staticPages: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), lastModified: latest, changeFrequency: "hourly", priority: 1 },
    { url: absoluteUrl("/news"), lastModified: latestOf("NEWS"), changeFrequency: "hourly", priority: 0.9 },
    { url: absoluteUrl("/blog"), lastModified: latestOf("BLOG"), changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/topics"), lastModified: latest, changeFrequency: "weekly", priority: 0.6 },
    { url: absoluteUrl("/authors"), changeFrequency: "monthly", priority: 0.4 },
    { url: absoluteUrl("/about"), changeFrequency: "yearly", priority: 0.4 },
    { url: absoluteUrl("/editorial-policy"), changeFrequency: "yearly", priority: 0.4 },
    { url: absoluteUrl("/contact"), changeFrequency: "yearly", priority: 0.3 },
    { url: absoluteUrl("/privacy"), changeFrequency: "yearly", priority: 0.2 },
    { url: absoluteUrl("/terms"), changeFrequency: "yearly", priority: 0.2 },
  ];

  return [
    ...staticPages,
    ...categories.map((c) => ({
      url: absoluteUrl(`/category/${c.slug}`),
      lastModified: c.posts[0]?.modifiedAt,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
    ...tags
      .filter((t) => t._count.posts >= 2)
      .map((t) => ({ url: absoluteUrl(`/tag/${t.slug}`), changeFrequency: "weekly" as const, priority: 0.4 })),
    ...authors
      .filter((a) => a._count.posts > 0)
      .map((a) => ({ url: absoluteUrl(`/author/${a.slug}`), changeFrequency: "weekly" as const, priority: 0.4 })),
    ...posts.map((p) => ({
      url: absoluteUrl(postPath(p)),
      lastModified: p.modifiedAt > (p.publishedAt ?? p.modifiedAt) ? p.modifiedAt : (p.publishedAt ?? p.modifiedAt),
      changeFrequency: (p.type === "NEWS" ? "weekly" : "monthly") as "weekly" | "monthly",
      priority: p.type === "NEWS" ? 0.7 : 0.8,
      images: [absoluteUrl(p.coverImage || `/og/${p.slug}`)],
    })),
  ];
}
