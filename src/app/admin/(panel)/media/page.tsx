import { db } from "@/lib/db";
import { deleteMedia, uploadMedia } from "../../actions";
import { ActionForm } from "../ActionForm";

export const metadata = { title: "Media library" };

export default async function MediaAdmin() {
  const media = await db.media.findMany({ orderBy: { createdAt: "desc" }, take: 200 });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-ink">Media library</h1>
      <div className="mb-8 max-w-xl rounded-lg border border-line bg-white p-5">
        <ActionForm action={uploadMedia} submitLabel="Upload image" encType="multipart/form-data">
          <div>
            <label htmlFor="file" className="label">
              Image (JPEG, PNG, WebP, GIF, AVIF — max 8 MB)
            </label>
            <input id="file" name="file" type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" required className="block text-sm" />
          </div>
          <div>
            <label htmlFor="alt" className="label">
              Default alt text
            </label>
            <input id="alt" name="alt" className="input" placeholder="Describe the image for screen readers and search" />
          </div>
        </ActionForm>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {media.map((m) => (
          <figure key={m.id} className="overflow-hidden rounded-lg border border-line bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={m.url} alt={m.alt} loading="lazy" className="aspect-video w-full bg-paper object-cover" />
            <figcaption className="space-y-2 p-3 text-xs">
              <input readOnly value={m.url} className="input font-mono text-xs" aria-label="Image URL" />
              <p className="text-muted">
                {(m.size / 1024).toFixed(0)} KB · {m.mime.replace("image/", "")}
                {m.alt && ` · alt: ${m.alt}`}
              </p>
              <p className="text-muted">
                Markdown: <code className="break-all">![{m.alt || "alt text"}]({m.url})</code>
              </p>
              <form action={deleteMedia}>
                <input type="hidden" name="id" value={m.id} />
                <button type="submit" className="cursor-pointer text-red-600 hover:underline">
                  Delete
                </button>
              </form>
            </figcaption>
          </figure>
        ))}
        {media.length === 0 && <p className="text-sm text-muted">No uploads yet.</p>}
      </div>
    </div>
  );
}
