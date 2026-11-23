import Link from "next/link";
import { db } from "@/lib/db";
import { deleteCategory, saveCategory } from "../../actions";
import { ActionForm } from "../ActionForm";

export const metadata = { title: "Categories" };

type Props = { searchParams: Promise<{ edit?: string; error?: string }> };

export default async function CategoriesAdmin({ searchParams }: Props) {
  const { edit, error } = await searchParams;
  const categories = await db.category.findMany({ orderBy: { sortOrder: "asc" }, include: { _count: { select: { posts: true } } } });
  const editing = edit ? categories.find((c) => c.id === edit) : undefined;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-ink">Categories</h1>
      {error && <p className="mb-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="overflow-x-auto rounded-lg border border-line bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-paper text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Articles</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {categories.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3 text-muted">{c.sortOrder}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">{c.name}</p>
                    <p className="text-xs text-muted">/category/{c.slug}</p>
                  </td>
                  <td className="px-4 py-3">{c._count.posts}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <Link href={`/admin/categories?edit=${c.id}`} className="text-brand hover:underline">
                      Edit
                    </Link>
                    <form action={deleteCategory} className="ml-3 inline">
                      <input type="hidden" name="id" value={c.id} />
                      <button type="submit" className="cursor-pointer text-red-600 hover:underline">
                        Delete
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-lg border border-line bg-white p-5">
          <h2 className="mb-4 font-semibold text-ink">{editing ? `Edit “${editing.name}”` : "Add category"}</h2>
          <ActionForm key={editing?.id ?? "new"} action={saveCategory} submitLabel={editing ? "Save category" : "Add category"}>
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
              <textarea id="description" name="description" rows={4} defaultValue={editing?.description} className="input" />
              <p className="hint">Shown on the category page and used as its meta description. Write 1–2 informative sentences.</p>
            </div>
            <div>
              <label htmlFor="sortOrder" className="label">
                Sort order
              </label>
              <input id="sortOrder" name="sortOrder" type="number" defaultValue={editing?.sortOrder ?? categories.length + 1} className="input" />
            </div>
          </ActionForm>
          {editing && (
            <Link href="/admin/categories" className="mt-3 inline-block text-sm text-muted hover:text-brand">
              Cancel
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
