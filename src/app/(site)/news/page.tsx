import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ListingPage } from "@/components/ListingPage";
import { listPosts } from "@/lib/posts";
import { pageMetadata } from "@/lib/seo";
import { clampPage } from "@/lib/utils";

export const revalidate = 300;

const title = "Industrial Automation News";
const description =
  "Breaking news and analysis from the industrial automation and control sector: PLC and DCS launches, OT cybersecurity advisories, standards updates, industrial networking and market moves.";

type Props = { searchParams: Promise<{ page?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const page = clampPage((await searchParams).page);
  return pageMetadata({ title: page > 1 ? `${title} — Page ${page}` : title, description, path: page > 1 ? `/news?page=${page}` : "/news" });
}

export default async function NewsIndex({ searchParams }: Props) {
  const page = clampPage((await searchParams).page);
  const { posts, totalPages } = await listPosts({ type: "NEWS" }, page);
  if (page > totalPages) notFound();
  return (
    <ListingPage
      title={title}
      kicker="News"
      description={description}
      path="/news"
      crumbs={[
        { name: "Home", path: "/" },
        { name: "News", path: "/news" },
      ]}
      posts={posts}
      page={page}
      totalPages={totalPages}
    />
  );
}
