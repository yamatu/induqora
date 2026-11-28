import Link from "next/link";
import { db } from "@/lib/db";
import { deleteTag, saveTag } from "../../actions";
import { ActionForm } from "../ActionForm";

export const metadata = { title: "Tags" };

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = { searchParams: Promise<{ edit?: string }> };

export default async function TagsAdmin({ searchParams }: Props) {
  const { edit } = await searchParams;
  const tags = await db.tag.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { posts: true } } } });
  const editing = edit ? tags.find((t) => t.id === edit) : undefined;

  return (
    <div>
      <h1 className="mb-2 text-2xl font-semibold text-ink">Tags</h1>
      <p className="mb-6 text-sm text-muted">Tags with fewer than two published articles are automatically set to noindex and excluded from the sitemap.</p>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="overflow-x-auto rounded-lg border border-line bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-paper text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Articles</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {tags.map((t) => (
                <tr key={t.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">{t.name}</p>
                    <p className="text-xs text-muted">/tag/{t.slug}</p>
                  </td>
                  <td className="px-4 py-3">{t._count.posts}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <Link href={`/admin/tags?edit=${t.id}`} className="text-brand hover:underline">
                      Edit
                    </Link>
                    <form action={deleteTag} className="ml-3 inline">
                      <input type="hidden" name="id" value={t.id} />
                      <button type="submit" className="cursor-pointer text-red-600 hover:underline">
                        Delete
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {tags.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-muted">
                    No tags yet. Tags are also created automatically when you save an article.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="rounded-lg border border-line bg-white p-5">
          <h2 className="mb-4 font-semibold text-ink">{editing ? `Edit “${editing.name}”` : "Add tag"}</h2>
          <ActionForm key={editing?.id ?? "new"} action={saveTag} submitLabel={editing ? "Save tag" : "Add tag"}>
            {editing && <input type="hidden" name="id" value={editing.id} />}
            <div>
              <label htmlFor="name" className="label">
                Name
              </label>
              <input id="name" name="name" defaultValue={editing?.name} required className="input" />
            </div>
            <div>
              <label htmlFor="slug" className="label">
                Slug
              </label>
              <input id="slug" name="slug" defaultValue={editing?.slug} className="input" placeholder="Generated from name" />
            </div>
            <div>
              <label htmlFor="description" className="label">
                Description
              </label>
              <textarea id="description" name="description" rows={3} defaultValue={editing?.description} className="input" />
            </div>
          </ActionForm>
          {editing && (
            <Link href="/admin/tags" className="mt-3 inline-block text-sm text-muted hover:text-brand">
              Cancel
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
