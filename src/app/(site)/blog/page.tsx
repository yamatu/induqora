import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ListingPage } from "@/components/ListingPage";
import { listPosts } from "@/lib/posts";
import { pageMetadata } from "@/lib/seo";
import { clampPage } from "@/lib/utils";

export const revalidate = 300;

const title = "Insights & Technical Guides";
const description =
  "In-depth guides, explainers and engineering analysis for controls engineers: PLC programming, PID tuning, industrial protocols, SCADA architecture, OT security and smart manufacturing.";

type Props = { searchParams: Promise<{ page?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const page = clampPage((await searchParams).page);
  return pageMetadata({ title: page > 1 ? `${title} — Page ${page}` : title, description, path: page > 1 ? `/blog?page=${page}` : "/blog" });
}

export default async function BlogIndex({ searchParams }: Props) {
  const page = clampPage((await searchParams).page);
  const { posts, totalPages } = await listPosts({ type: "BLOG" }, page);
  if (page > totalPages) notFound();
  return (
    <ListingPage
      title={title}
      kicker="Insights"
      description={description}
      path="/blog"
      crumbs={[
        { name: "Home", path: "/" },
        { name: "Insights", path: "/blog" },
      ]}
      posts={posts}
      page={page}
      totalPages={totalPages}
    />
  );
}
