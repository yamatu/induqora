import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { postPath, siteConfig } from "@/lib/site";
import { formatDateTime } from "@/lib/utils";
import { deletePost } from "../../../actions";
import { PostForm } from "../PostForm";
import { formOptions, toFormValues } from "../form-data";

export const metadata = { title: "Edit article" };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> };

export default async function EditPostPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { saved } = await searchParams;
  const [post, { categories, authors }] = await Promise.all([db.post.findUnique({ where: { id }, include: { tags: true } }), formOptions()]);
  if (!post) notFound();
  const live = post.status === "PUBLISHED" && post.publishedAt && post.publishedAt <= new Date();

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/admin/posts" className="text-sm text-muted hover:text-brand">
            ← Articles
          </Link>
          <h1 className="text-2xl font-semibold text-ink">Edit article</h1>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted">Last saved {formatDateTime(post.updatedAt)}</span>
          {live && (
            <Link href={postPath(post)} target="_blank" className="text-brand hover:underline">
              View live ↗
            </Link>
          )}
        </div>
      </div>
      {saved && <p className="mb-4 rounded-md bg-emerald-50 px-4 py-2 text-sm text-emerald-800">Article created.</p>}
      <PostForm initial={toFormValues(post)} categories={categories} authors={authors} siteUrl={siteConfig.url} />
      <form action={deletePost} className="mt-10 border-t border-line pt-6">
        <input type="hidden" name="id" value={post.id} />
        <details>
          <summary className="cursor-pointer text-sm text-red-600">Delete this article…</summary>
          <p className="mt-2 text-sm text-steel">This permanently removes the article. Consider unpublishing (set to Draft) instead to preserve the URL history.</p>
          <button type="submit" className="btn-danger mt-3">
            Permanently delete
          </button>
        </details>
      </form>
    </div>
  );
}
