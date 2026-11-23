import type { Post, Tag } from "@prisma/client";
import { db } from "@/lib/db";
import { parseJsonArray, type Faq, type Source } from "@/lib/utils";
import type { PostFormValues } from "./PostForm";

export async function formOptions() {
  const [categories, authors] = await Promise.all([
    db.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
    db.author.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  return { categories, authors };
}

export function toFormValues(post: (Post & { tags: Tag[] }) | null, defaults: { categoryId?: string; authorId?: string } = {}): PostFormValues {
  if (!post) {
    return {
      title: "",
      slug: "",
      type: "BLOG",
      status: "DRAFT",
      excerpt: "",
      content: "",
      keyTakeaways: "",
      faqsText: "",
      sourcesText: "",
      categoryId: defaults.categoryId ?? "",
      authorId: defaults.authorId ?? "",
      tags: "",
      coverImage: "",
      coverAlt: "",
      coverCaption: "",
      seoTitle: "",
      seoDescription: "",
      canonicalUrl: "",
      noindex: false,
      featured: false,
      publishedAt: "",
    };
  }
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    type: post.type,
    status: post.status,
    excerpt: post.excerpt,
    content: post.content,
    keyTakeaways: post.keyTakeaways,
    faqsText: parseJsonArray<Faq>(post.faqs)
      .map((f) => `Q: ${f.q}\nA: ${f.a}`)
      .join("\n\n"),
    sourcesText: parseJsonArray<Source>(post.sources)
      .map((s) => (s.url ? `${s.title} | ${s.url}` : s.title))
      .join("\n"),
    categoryId: post.categoryId,
    authorId: post.authorId,
    tags: post.tags.map((t) => t.name).join(", "),
    coverImage: post.coverImage,
    coverAlt: post.coverAlt,
    coverCaption: post.coverCaption,
    seoTitle: post.seoTitle,
    seoDescription: post.seoDescription,
    canonicalUrl: post.canonicalUrl,
    noindex: post.noindex,
    featured: post.featured,
    publishedAt: post.publishedAt ? post.publishedAt.toISOString().slice(0, 16) : "",
  };
}
