import Link from "next/link";
import { db } from "@/lib/db";
import { deleteAuthor, saveAuthor } from "../../actions";
import { ActionForm } from "../ActionForm";

export const metadata = { title: "Authors" };

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = { searchParams: Promise<{ edit?: string; error?: string }> };

const fields = [
  { name: "name", label: "Full name", required: true },
  { name: "slug", label: "Slug", placeholder: "Generated from name" },
  { name: "jobTitle", label: "Job title / credentials", placeholder: "e.g. Senior Controls Engineer, PE" },
  { name: "expertise", label: "Areas of expertise (comma-separated)", placeholder: "PLC programming, IEC 62443, PROFINET" },
  { name: "avatarUrl", label: "Photo URL", placeholder: "/media/…" },
  { name: "linkedinUrl", label: "LinkedIn URL" },
  { name: "xUrl", label: "X (Twitter) URL" },
  { name: "websiteUrl", label: "Personal website" },
] as const;

export default async function AuthorsAdmin({ searchParams }: Props) {
  const { edit, error } = await searchParams;
  const authors = await db.author.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { posts: true } } } });
  const editing = edit ? authors.find((a) => a.id === edit) : undefined;

  return (
    <div>
      <h1 className="mb-2 text-2xl font-semibold text-ink">Authors</h1>
      <p className="mb-6 text-sm text-muted">
        Real names, verifiable credentials and profile links strengthen E-E-A-T signals for search engines and AI answer engines.
      </p>
      {error && <p className="mb-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="space-y-3">
          {authors.map((a) => (
            <div key={a.id} className="flex items-start justify-between gap-4 rounded-lg border border-line bg-white p-4">
              <div>
                <p className="font-medium text-ink">{a.name}</p>
                <p className="text-xs text-muted">
                  {a.jobTitle || "No job title"} · {a._count.posts} articles · /author/{a.slug}
                </p>
                <p className="mt-1 line-clamp-2 text-sm text-steel">{a.bio}</p>
              </div>
              <div className="shrink-0 text-sm whitespace-nowrap">
                <Link href={`/admin/authors?edit=${a.id}`} className="text-brand hover:underline">
                  Edit
                </Link>
                <form action={deleteAuthor} className="ml-3 inline">
                  <input type="hidden" name="id" value={a.id} />
                  <button type="submit" className="cursor-pointer text-red-600 hover:underline">
                    Delete
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-line bg-white p-5">
          <h2 className="mb-4 font-semibold text-ink">{editing ? `Edit “${editing.name}”` : "Add author"}</h2>
          <ActionForm key={editing?.id ?? "new"} action={saveAuthor} submitLabel={editing ? "Save author" : "Add author"}>
            {editing && <input type="hidden" name="id" value={editing.id} />}
            {fields.map((f) => (
              <div key={f.name}>
                <label htmlFor={f.name} className="label">
                  {f.label}
                </label>
                <input
                  id={f.name}
                  name={f.name}
                  defaultValue={editing?.[f.name]}
                  required={"required" in f}
                  placeholder={"placeholder" in f ? f.placeholder : undefined}
                  className="input"
                />
              </div>
            ))}
            <div>
              <label htmlFor="bio" className="label">
                Bio
              </label>
              <textarea id="bio" name="bio" rows={5} defaultValue={editing?.bio} className="input" />
              <p className="hint">Describe real, relevant experience: years in the field, industries, certifications.</p>
            </div>
          </ActionForm>
          {editing && (
            <Link href="/admin/authors" className="mt-3 inline-block text-sm text-muted hover:text-brand">
              Cancel
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
