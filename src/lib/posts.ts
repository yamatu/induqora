import type { Prisma } from "@prisma/client";
import { db } from "./db";
import { POSTS_PER_PAGE } from "./site";

export function publishedWhere(extra: Prisma.PostWhereInput = {}): Prisma.PostWhereInput {
  return { status: "PUBLISHED", publishedAt: { lte: new Date() }, ...extra };
}

export const cardInclude = {
  author: { select: { name: true, slug: true } },
  category: { select: { name: true, slug: true } },
} satisfies Prisma.PostInclude;

export type PostCardData = Prisma.PostGetPayload<{ include: typeof cardInclude }>;

export async function listPosts(where: Prisma.PostWhereInput, page = 1, perPage = POSTS_PER_PAGE) {
  const fullWhere = publishedWhere(where);
  const [posts, total] = await Promise.all([
    db.post.findMany({
      where: fullWhere,
      include: cardInclude,
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    db.post.count({ where: fullWhere }),
  ]);
  return { posts, total, page, totalPages: Math.max(1, Math.ceil(total / perPage)) };
}

export async function getPublishedPost(slug: string, type?: string) {
  return db.post.findFirst({
    where: publishedWhere({ slug, ...(type ? { type } : {}) }),
    include: { author: true, category: true, tags: { orderBy: { name: "asc" } } },
  });
}

export async function getRelatedPosts(post: { id: string; categoryId: string; tags: { id: string }[] }, take = 3) {
  const tagIds = post.tags.map((t) => t.id);
  const related = await db.post.findMany({
    where: publishedWhere({
      id: { not: post.id },
      OR: [{ categoryId: post.categoryId }, ...(tagIds.length ? [{ tags: { some: { id: { in: tagIds } } } }] : [])],
    }),
    include: { ...cardInclude, tags: { select: { id: true } } },
    orderBy: { publishedAt: "desc" },
    take: 20,
  });
  return related
    .map((p) => ({
      post: p,
      score: (p.categoryId === post.categoryId ? 2 : 0) + p.tags.filter((t) => tagIds.includes(t.id)).length,
    }))
    .sort((a, b) => b.score - a.score || +b.post.publishedAt! - +a.post.publishedAt!)
    .slice(0, take)
    .map((r) => r.post);
}

export async function getAdjacentPosts(post: { id: string; type: string; publishedAt: Date | null }) {
  if (!post.publishedAt) return { prev: null, next: null };
  const [prev, next] = await Promise.all([
    db.post.findFirst({
      where: publishedWhere({ type: post.type, publishedAt: { lt: post.publishedAt } }),
      orderBy: { publishedAt: "desc" },
      select: { slug: true, title: true, type: true },
    }),
    db.post.findFirst({
      where: { status: "PUBLISHED", type: post.type, publishedAt: { gt: post.publishedAt, lte: new Date() } },
      orderBy: { publishedAt: "asc" },
      select: { slug: true, title: true, type: true },
    }),
  ]);
  return { prev, next };
}

export async function searchPosts(q: string, page = 1) {
  const terms = q.trim().split(/\s+/).filter(Boolean).slice(0, 6);
  if (!terms.length) return { posts: [], total: 0, page: 1, totalPages: 1 };
  const where: Prisma.PostWhereInput = {
    AND: terms.map((term) => ({
      OR: [
        { title: { contains: term } },
        { excerpt: { contains: term } },
        { content: { contains: term } },
        { tags: { some: { name: { contains: term } } } },
      ],
    })),
  };
  return listPosts(where, page);
}
