import type { Prisma } from "@prisma/client";
import Link from "next/link";
import { Pagination } from "@/components/Pagination";
import { db } from "@/lib/db";
import { postPath } from "@/lib/site";
import { clampPage, formatDateTime } from "@/lib/utils";

export const metadata = { title: "Articles" };

const PER_PAGE = 25;

type Props = { searchParams: Promise<{ q?: string; status?: string; type?: string; page?: string }> };

export default async function PostsAdmin({ searchParams }: Props) {
  const sp = await searchParams;
  const page = clampPage(sp.page);
  const q = (sp.q || "").trim();
  const now = new Date();

  const where: Prisma.PostWhereInput = {
    ...(q ? { OR: [{ title: { contains: q } }, { slug: { contains: q } }] } : {}),
    ...(sp.type === "NEWS" || sp.type === "BLOG" ? { type: sp.type } : {}),
    ...(sp.status === "DRAFT" ? { status: "DRAFT" } : {}),
    ...(sp.status === "PUBLISHED" ? { status: "PUBLISHED", publishedAt: { lte: now } } : {}),
    ...(sp.status === "SCHEDULED" ? { status: "PUBLISHED", publishedAt: { gt: now } } : {}),
  };

  const [posts, total] = await Promise.all([
    db.post.findMany({
      where,
      include: { author: { select: { name: true } }, category: { select: { name: true } } },
      orderBy: [{ updatedAt: "desc" }],
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
    db.post.count({ where }),
  ]);

  const extra: Record<string, string> = {};
  if (q) extra.q = q;
  if (sp.status) extra.status = sp.status;
  if (sp.type) extra.type = sp.type;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-ink">Articles</h1>
        <Link href="/admin/posts/new" className="btn-primary">
          + New article
        </Link>
      </div>

      <form method="get" className="mb-4 flex flex-wrap gap-2">
        <input name="q" defaultValue={q} placeholder="Search title or slug" className="input max-w-xs" />
        <select name="type" defaultValue={sp.type || ""} className="input w-auto">
          <option value="">All types</option>
          <option value="NEWS">News</option>
          <option value="BLOG">Insights</option>
        </select>
        <select name="status" defaultValue={sp.status || ""} className="input w-auto">
          <option value="">All statuses</option>
          <option value="PUBLISHED">Published</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="DRAFT">Draft</option>
        </select>
        <button type="submit" className="btn-secondary">
          Filter
        </button>
      </form>

      <div className="overflow-x-auto rounded-lg border border-line bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-paper text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Author</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Publish date (UTC)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {posts.map((p) => {
              const scheduled = p.status === "PUBLISHED" && p.publishedAt && p.publishedAt > now;
              const label = scheduled ? "SCHEDULED" : p.status;
              return (
                <tr key={p.id} className="hover:bg-paper">
                  <td className="max-w-md px-4 py-3">
                    <Link href={`/admin/posts/${p.id}`} className="font-medium text-ink hover:text-brand">
                      {p.title}
                    </Link>
                    <div className="mt-0.5 flex gap-3 text-xs text-muted">
                      <span>/{p.slug}</span>
                      {label === "PUBLISHED" && (
                        <Link href={postPath(p)} target="_blank" className="text-brand">
                          View ↗
                        </Link>
                      )}
                      <Link href={`/admin/posts/${p.id}/preview`} target="_blank" className="text-brand">
                        Preview
                      </Link>
                    </div>
                  </td>
                  <td className="px-4 py-3">{p.type === "NEWS" ? "News" : "Insights"}</td>
                  <td className="px-4 py-3">{p.category.name}</td>
                  <td className="px-4 py-3">{p.author.name}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded px-2 py-0.5 text-xs ${
                        label === "PUBLISHED" ? "bg-emerald-100 text-emerald-800" : label === "SCHEDULED" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {label}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted">{formatDateTime(p.publishedAt)}</td>
                </tr>
              );
            })}
            {posts.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted">
                  No articles found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-muted">{total} articles</p>
      <Pagination basePath="/admin/posts" page={page} totalPages={Math.max(1, Math.ceil(total / PER_PAGE))} extra={extra} />
    </div>
  );
}
