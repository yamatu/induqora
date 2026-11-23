import { notFound } from "next/navigation";
import { ArticleView } from "@/components/ArticleView";
import { db } from "@/lib/db";
import { renderMarkdown } from "@/lib/markdown";

export const metadata = { title: "Preview" };

export default async function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await db.post.findUnique({ where: { id }, include: { author: true, category: true, tags: true } });
  if (!post) notFound();
  const { html, toc } = renderMarkdown(post.content);
  const display = { ...post, publishedAt: post.publishedAt ?? new Date() };
  return (
    <div className="-m-4 bg-white py-4 sm:-m-8 sm:py-8">
      <ArticleView post={display} html={html} toc={toc} related={[]} adjacent={{ prev: null, next: null }} preview />
    </div>
  );
}
