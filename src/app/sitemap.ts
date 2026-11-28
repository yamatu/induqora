import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { publishedWhere } from "@/lib/posts";
import { effectiveModifiedDate } from "@/lib/seo";
import { absoluteUrl, postPath, siteConfig } from "@/lib/site";

export const revalidate = 3600;

/** Mirrors INDEX_MIN_POSTS in the tag route: thinner tags are noindex, so they leave the sitemap too. */
const TAG_INDEX_MIN_POSTS = 3;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, categories, tags, authors] = await Promise.all([
    db.post.findMany({
      where: publishedWhere({ noindex: false, canonicalUrl: "" }),
      select: { slug: true, type: true, modifiedAt: true, publishedAt: true, coverImage: true },
      orderBy: { publishedAt: "desc" },
    }),
    db.category.findMany({
      select: { slug: true, posts: { where: publishedWhere(), select: { modifiedAt: true, publishedAt: true }, orderBy: { modifiedAt: "desc" }, take: 1 } },
    }),
    db.tag.findMany({
      select: {
        slug: true,
        _count: { select: { posts: { where: publishedWhere() } } },
        posts: { where: publishedWhere(), select: { modifiedAt: true, publishedAt: true }, orderBy: { modifiedAt: "desc" }, take: 1 },
      },
    }),
    db.author.findMany({
      select: {
        slug: true,
        _count: { select: { posts: { where: publishedWhere() } } },
        posts: { where: publishedWhere(), select: { modifiedAt: true, publishedAt: true }, orderBy: { modifiedAt: "desc" }, take: 1 },
      },
    }),
  ]);

  const latest = posts[0] ? effectiveModifiedDate(posts[0]) : new Date();
  const latestOf = (type: string) => {
    const p = posts.find((x) => x.type === type);
    return p ? effectiveModifiedDate(p) : latest;
  };
  const policyDate = new Date("2026-11-22T00:00:00.000Z");

  // Next.js emits the home canonical as the bare origin (no trailing slash), so keep the
  // sitemap entry identical instead of the "https://host/" form they used to disagree on.
  const staticPages: MetadataRoute.Sitemap = [
    { url: siteConfig.url, lastModified: latest, changeFrequency: "hourly", priority: 1 },
    { url: absoluteUrl("/news"), lastModified: latestOf("NEWS"), changeFrequency: "hourly", priority: 0.9 },
    { url: absoluteUrl("/blog"), lastModified: latestOf("BLOG"), changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/topics"), lastModified: latest, changeFrequency: "weekly", priority: 0.7 },
    { url: absoluteUrl("/authors"), lastModified: latest, changeFrequency: "monthly", priority: 0.5 },
    { url: absoluteUrl("/about"), lastModified: policyDate, changeFrequency: "yearly", priority: 0.5 },
    { url: absoluteUrl("/editorial-policy"), lastModified: policyDate, changeFrequency: "yearly", priority: 0.5 },
    { url: absoluteUrl("/contact"), lastModified: policyDate, changeFrequency: "yearly", priority: 0.3 },
    { url: absoluteUrl("/privacy"), lastModified: policyDate, changeFrequency: "yearly", priority: 0.2 },
    { url: absoluteUrl("/terms"), lastModified: policyDate, changeFrequency: "yearly", priority: 0.2 },
  ];

  return [
    ...staticPages,
    ...categories.map((c) => ({
      url: absoluteUrl(`/category/${c.slug}`),
      lastModified: c.posts[0] ? effectiveModifiedDate(c.posts[0]) : latest,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
    ...tags
      .filter((t) => t._count.posts >= TAG_INDEX_MIN_POSTS)
      .map((t) => ({
        url: absoluteUrl(`/tag/${t.slug}`),
        lastModified: t.posts[0] ? effectiveModifiedDate(t.posts[0]) : latest,
        changeFrequency: "weekly" as const,
        priority: 0.4,
      })),
    ...authors
      .filter((a) => a._count.posts > 0)
      .map((a) => ({
        url: absoluteUrl(`/author/${a.slug}`),
        lastModified: a.posts[0] ? effectiveModifiedDate(a.posts[0]) : latest,
        changeFrequency: "weekly" as const,
        priority: 0.5,
      })),
    ...posts.map((p) => ({
      url: absoluteUrl(postPath(p)),
      lastModified: effectiveModifiedDate(p),
      changeFrequency: (p.type === "NEWS" ? "weekly" : "monthly") as "weekly" | "monthly",
      priority: p.type === "NEWS" ? 0.8 : 0.85,
      images: [absoluteUrl(p.coverImage || `/og/${p.slug}`)],
    })),
  ];
}
