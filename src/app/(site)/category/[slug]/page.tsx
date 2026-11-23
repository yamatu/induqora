import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ListingPage } from "@/components/ListingPage";
import { db } from "@/lib/db";
import { listPosts } from "@/lib/posts";
import { pageMetadata } from "@/lib/seo";
import { clampPage } from "@/lib/utils";

export const revalidate = 300;

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> };

const getCategory = cache(async (slug: string) => {
  const category = await db.category.findUnique({ where: { slug } });
  if (!category) notFound();
  return category;
});

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const category = await getCategory((await params).slug);
  const page = clampPage((await searchParams).page);
  const path = `/category/${category.slug}`;
  return pageMetadata({
    title: `${category.name}${page > 1 ? ` — Page ${page}` : ""}`,
    description: category.description || `News, guides and analysis on ${category.name} from Induqora.`,
    path: page > 1 ? `${path}?page=${page}` : path,
  });
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const category = await getCategory((await params).slug);
  const page = clampPage((await searchParams).page);
  const { posts, totalPages } = await listPosts({ categoryId: category.id }, page);
  if (page > totalPages) notFound();
  const path = `/category/${category.slug}`;
  return (
    <ListingPage
      title={category.name}
      kicker="Topic"
      description={category.description || `News, guides and analysis on ${category.name}.`}
      path={path}
      crumbs={[
        { name: "Home", path: "/" },
        { name: "Topics", path: "/topics" },
        { name: category.name, path },
      ]}
      posts={posts}
      page={page}
      totalPages={totalPages}
    />
  );
}
