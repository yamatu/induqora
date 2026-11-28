import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ListingPage } from "@/components/ListingPage";
import { db } from "@/lib/db";
import { listPosts, publishedWhere } from "@/lib/posts";
import { pageMetadata } from "@/lib/seo";
import { clampPage } from "@/lib/utils";

export const revalidate = 300;

/** Tags below this post count are too thin to rank and only burn crawl budget. */
const INDEX_MIN_POSTS = 3;

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> };

const getTag = cache(async (slug: string) => {
  const tag = await db.tag.findUnique({ where: { slug: decodeURIComponent(slug) } });
  if (!tag) notFound();
  const count = await db.post.count({ where: publishedWhere({ tags: { some: { id: tag.id } } }) });
  return { ...tag, count };
});

function tagDescription(name: string, count: number) {
  return `${count} Induqora articles on ${name} — technical explainers, news and engineering analysis.`;
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const tag = await getTag((await params).slug);
  const page = clampPage((await searchParams).page);
  const path = `/tag/${tag.slug}`;
  return pageMetadata({
    title: `${tag.name}${page > 1 ? ` — Page ${page}` : ""}`,
    description: tag.description || tagDescription(tag.name, tag.count),
    path: page > 1 ? `${path}?page=${page}` : path,
    noindex: tag.count < INDEX_MIN_POSTS,
  });
}

export default async function TagPage({ params, searchParams }: Props) {
  const tag = await getTag((await params).slug);
  const page = clampPage((await searchParams).page);
  const { posts, totalPages } = await listPosts({ tags: { some: { id: tag.id } } }, page);
  if (page > totalPages) notFound();
  const path = `/tag/${tag.slug}`;
  return (
    <ListingPage
      title={tag.name}
      kicker="Tag"
      description={tag.description || tagDescription(tag.name, tag.count)}
      path={path}
      crumbs={[
        { name: "Home", path: "/" },
        { name: "Topics", path: "/topics" },
        { name: tag.name, path },
      ]}
      posts={posts}
      page={page}
      totalPages={totalPages}
    />
  );
}
