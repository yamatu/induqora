import { db } from "./db";
import { renderMarkdown } from "./markdown";
import { publishedWhere } from "./posts";

export async function feedPosts(take = 50) {
  const posts = await db.post.findMany({
    where: publishedWhere({ noindex: false }),
    include: { author: true, category: true, tags: true },
    orderBy: { publishedAt: "desc" },
    take,
  });
  return posts.map((p) => ({ ...p, html: renderMarkdown(p.content).html }));
}
