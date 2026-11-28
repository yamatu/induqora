import { revalidatePath } from "next/cache";
import { db } from "./db";

/**
 * Purges every cached surface that renders post data.
 *
 * Called from two places:
 *  - POST /api/revalidate   (scripts/publish-posts.sh after seeding Markdown)
 *  - admin server actions    (create / edit / delete from the panel)
 *
 * The feeds (/llms.txt, /rss.xml, sitemap) and the admin dashboard were
 * previously left on their own ISR timers, which is why the panel could keep
 * showing a stale post count after articles were published.
 */
export async function revalidateAllSiteContent(slug?: string) {
  // Static-ish aggregates.
  for (const path of [
    "/",
    "/blog",
    "/news",
    "/topics",
    "/about",
    "/sitemap.xml",
    "/news-sitemap.xml",
    "/rss.xml",
    "/llms.txt",
    "/llms-full.txt",
    // Admin surfaces render live counts; purge so the panel never shows stale totals.
    "/admin",
    "/admin/posts",
    "/admin/tags",
    "/admin/categories",
    "/admin/authors",
    "/admin/media",
  ]) {
    revalidatePath(path);
  }

  // The post itself, on both possible prefixes.
  if (slug) {
    revalidatePath(`/blog/${slug}`);
    revalidatePath(`/news/${slug}`);
    revalidatePath(`/md/${slug}`);
  }

  // Taxonomy and author archives: purged by layout so every slug under the
  // segment is invalidated without enumerating the table.
  revalidatePath("/blog/[slug]", "page");
  revalidatePath("/news/[slug]", "page");
  revalidatePath("/tag/[slug]", "page");
  revalidatePath("/category/[slug]", "page");
  revalidatePath("/author/[slug]", "page");

  // Pagination is query-string driven, so page 1 of each listing needs the
  // explicit path (revalidatePath cannot enumerate arbitrary ?page= values).
  try {
    const [cats, tags, authors] = await Promise.all([
      db.category.findMany({ select: { slug: true } }),
      db.tag.findMany({ select: { slug: true } }),
      db.author.findMany({ select: { slug: true } }),
    ]);
    for (const c of cats) revalidatePath(`/category/${c.slug}`);
    for (const t of tags) revalidatePath(`/tag/${t.slug}`);
    for (const a of authors) revalidatePath(`/author/${a.slug}`);
  } catch {
    // A taxonomy query failure must never break publishing.
  }

  return { revalidatedAt: new Date().toISOString() };
}
