"use client";

import Link from "next/link";
import { useActionState, useMemo, useState, useTransition } from "react";
import { previewMarkdown, savePost, type ActionState } from "../../actions";

export type PostFormValues = {
  id?: string;
  title: string;
  slug: string;
  type: string;
  status: string;
  excerpt: string;
  content: string;
  keyTakeaways: string;
  faqsText: string;
  sourcesText: string;
  categoryId: string;
  authorId: string;
  tags: string;
  coverImage: string;
  coverAlt: string;
  coverCaption: string;
  seoTitle: string;
  seoDescription: string;
  canonicalUrl: string;
  noindex: boolean;
  featured: boolean;
  publishedAt: string;
};

type Option = { id: string; name: string };

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
}

function Counter({ value, max, ideal }: { value: string; max: number; ideal: [number, number] }) {
  const n = value.length;
  const color = n === 0 ? "text-muted" : n > max ? "text-red-600" : n >= ideal[0] && n <= ideal[1] ? "text-emerald-700" : "text-amber-700";
  return (
    <span className={`text-xs ${color}`}>
      {n}/{max}
    </span>
  );
}

function FieldError({ msg }: { msg?: string }) {
  return msg ? <p className="mt-1 text-xs text-red-600">{msg}</p> : null;
}

export function PostForm({ initial, categories, authors, siteUrl }: { initial: PostFormValues; categories: Option[]; authors: Option[]; siteUrl: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(savePost, { ok: false, message: "" });
  const [v, setV] = useState(initial);
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.id));
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewing, startPreview] = useTransition();
  const errors = state.errors ?? {};

  const set = <K extends keyof PostFormValues>(key: K, value: PostFormValues[K]) => setV((prev) => ({ ...prev, [key]: value }));

  const checks = useMemo(() => {
    const words = v.content.split(/\s+/).filter(Boolean).length;
    const h2 = (v.content.match(/^##\s/gm) || []).length;
    const takeaways = v.keyTakeaways.split("\n").filter((l) => l.trim()).length;
    const faqs = (v.faqsText.match(/^\s*Q:/gim) || []).length;
    const sources = v.sourcesText.split("\n").filter((l) => l.trim()).length;
    const minWords = v.type === "NEWS" ? 300 : 1000;
    return [
      { ok: words >= minWords, label: `Body length: ${words} words (aim for ${minWords}+)` },
      { ok: h2 >= 2, label: `Structured with H2 sections (${h2})` },
      { ok: takeaways >= 3 && takeaways <= 6, label: `Key takeaways: ${takeaways} (aim for 3–6 self-contained facts)` },
      { ok: faqs >= 2 || v.type === "NEWS", label: `FAQs: ${faqs} ${v.type === "NEWS" ? "(optional for news)" : "(aim for 2+)"}` },
      { ok: sources >= 2, label: `Cited sources: ${sources} (aim for 2+ primary sources)` },
      { ok: v.excerpt.length >= 120 && v.excerpt.length <= 300, label: "Excerpt is 120–300 characters" },
      { ok: !v.coverImage || Boolean(v.coverAlt), label: "Cover image has alt text" },
    ];
  }, [v]);

  const serpTitle = (v.seoTitle || v.title || "Article title") + " | Induqora";
  const serpDesc = v.seoDescription || v.excerpt || "Meta description preview";
  const path = `${v.type === "NEWS" ? "/news" : "/blog"}/${v.slug || "slug"}`;

  return (
    <form action={action} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      {v.id && <input type="hidden" name="id" value={v.id} />}

      <div className="space-y-5">
        <div className="rounded-lg border border-line bg-white p-5">
          <label htmlFor="title" className="label">
            Headline
          </label>
          <input
            id="title"
            name="title"
            value={v.title}
            onChange={(e) => {
              set("title", e.target.value);
              if (!slugTouched) set("slug", slugify(e.target.value));
            }}
            required
            className="input text-lg font-semibold"
            placeholder="A clear, specific headline that answers what the article is about"
          />
          <FieldError msg={errors.title} />

          <label htmlFor="slug" className="label mt-4">
            URL slug
          </label>
          <div className="flex items-center gap-1 text-sm text-muted">
            <span className="shrink-0">{siteUrl + (v.type === "NEWS" ? "/news/" : "/blog/")}</span>
            <input
              id="slug"
              name="slug"
              value={v.slug}
              onChange={(e) => {
                setSlugTouched(true);
                set("slug", e.target.value);
              }}
              className="input"
            />
          </div>
          <FieldError msg={errors.slug} />

          <label htmlFor="excerpt" className="label mt-4">
            Excerpt / standfirst <Counter value={v.excerpt} max={320} ideal={[120, 300]} />
          </label>
          <textarea id="excerpt" name="excerpt" rows={3} value={v.excerpt} onChange={(e) => set("excerpt", e.target.value)} className="input" />
          <p className="hint">Shown under the headline, in listings and feeds. Summarize the answer, not just the topic.</p>
          <FieldError msg={errors.excerpt} />
        </div>

        <div className="rounded-lg border border-line bg-white">
          <div className="flex items-center gap-1 border-b border-line px-3 pt-3">
            {(["write", "preview"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setTab(t);
                  if (t === "preview") startPreview(async () => setPreviewHtml(await previewMarkdown(v.content)));
                }}
                className={`rounded-t-md px-4 py-2 text-sm font-medium ${tab === t ? "border border-b-white border-line bg-white text-ink -mb-px" : "text-muted"}`}
              >
                {t === "write" ? "Write (Markdown)" : "Preview"}
              </button>
            ))}
          </div>
          <div className="p-5">
            <textarea
              name="content"
              value={v.content}
              onChange={(e) => set("content", e.target.value)}
              rows={28}
              className={`input font-mono text-[13px] leading-6 ${tab === "write" ? "" : "hidden"}`}
              placeholder={"## Section heading\n\nWrite in Markdown. Use ## and ### headings — they build the table of contents."}
            />
            {tab === "preview" &&
              (previewing ? (
                <p className="text-sm text-muted">Rendering…</p>
              ) : (
                <div className="article-body prose prose-slate max-w-none" dangerouslySetInnerHTML={{ __html: previewHtml }} />
              ))}
            <FieldError msg={errors.content} />
          </div>
        </div>

        <div className="rounded-lg border border-line bg-white p-5">
          <h2 className="font-semibold text-ink">Answer-engine (GEO) blocks</h2>
          <p className="hint mb-4">These structured blocks help search engines and AI assistants quote your article accurately.</p>

          <label htmlFor="keyTakeaways" className="label">
            Key takeaways — one per line
          </label>
          <textarea id="keyTakeaways" name="keyTakeaways" rows={5} value={v.keyTakeaways} onChange={(e) => set("keyTakeaways", e.target.value)} className="input" />
          <p className="hint">Each line should be a complete, factual sentence that makes sense on its own.</p>

          <label htmlFor="faqs" className="label mt-4">
            FAQs
          </label>
          <textarea
            id="faqs"
            name="faqs"
            rows={8}
            value={v.faqsText}
            onChange={(e) => set("faqsText", e.target.value)}
            className="input font-mono text-[13px]"
            placeholder={"Q: What is OPC UA?\nA: OPC UA is a platform-independent ...\n\nQ: ...\nA: ..."}
          />
          <p className="hint">Use “Q:” and “A:” prefixes. Output as FAQPage structured data.</p>

          <label htmlFor="sources" className="label mt-4">
            Sources — one per line: <code>Title | https://url</code>
          </label>
          <textarea id="sources" name="sources" rows={4} value={v.sourcesText} onChange={(e) => set("sourcesText", e.target.value)} className="input font-mono text-[13px]" />
        </div>
      </div>

      <div className="space-y-5">
        <div className="space-y-5">
          <div className="rounded-lg border border-line bg-white p-5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="type" className="label">
                  Type
                </label>
                <select id="type" name="type" value={v.type} onChange={(e) => set("type", e.target.value)} className="input">
                  <option value="NEWS">News</option>
                  <option value="BLOG">Insights</option>
                </select>
              </div>
              <div>
                <label htmlFor="status" className="label">
                  Status
                </label>
                <select id="status" name="status" value={v.status} onChange={(e) => set("status", e.target.value)} className="input">
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                </select>
              </div>
            </div>
            <label htmlFor="publishedAt" className="label mt-3">
              Publish date & time (UTC)
            </label>
            <input id="publishedAt" name="publishedAt" type="datetime-local" value={v.publishedAt} onChange={(e) => set("publishedAt", e.target.value)} className="input" />
            <p className="hint">Leave empty to publish now. A future date schedules the article.</p>

            <div className="mt-3 space-y-2 text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" name="featured" checked={v.featured} onChange={(e) => set("featured", e.target.checked)} /> Feature on homepage
              </label>
              {v.id && (
                <label className="flex items-start gap-2">
                  <input type="checkbox" name="bumpModified" className="mt-1" /> <span>Substantive update — set “Updated” date to now</span>
                </label>
              )}
            </div>

            {state.message && (
              <p role="status" className={`mt-4 rounded-md px-3 py-2 text-sm ${state.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>
                {state.message}
              </p>
            )}
            <div className="mt-4 flex gap-2">
              <button type="submit" className="btn-primary flex-1" disabled={pending}>
                {pending ? "Saving…" : v.id ? "Save changes" : "Create article"}
              </button>
              {v.id && (
                <Link href={`/admin/posts/${v.id}/preview`} target="_blank" className="btn-secondary">
                  Preview
                </Link>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-line bg-white p-5">
            <label htmlFor="categoryId" className="label">
              Category
            </label>
            <select id="categoryId" name="categoryId" value={v.categoryId} onChange={(e) => set("categoryId", e.target.value)} className="input">
              <option value="">Choose…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <FieldError msg={errors.categoryId} />

            <label htmlFor="authorId" className="label mt-3">
              Author
            </label>
            <select id="authorId" name="authorId" value={v.authorId} onChange={(e) => set("authorId", e.target.value)} className="input">
              <option value="">Choose…</option>
              {authors.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
            <FieldError msg={errors.authorId} />

            <label htmlFor="tags" className="label mt-3">
              Tags (comma-separated)
            </label>
            <input id="tags" name="tags" value={v.tags} onChange={(e) => set("tags", e.target.value)} className="input" placeholder="OPC UA, IEC 62443" />
          </div>

          <div className="rounded-lg border border-line bg-white p-5">
            <label htmlFor="coverImage" className="label">
              Cover image URL
            </label>
            <input id="coverImage" name="coverImage" value={v.coverImage} onChange={(e) => set("coverImage", e.target.value)} className="input" placeholder="/media/2026/11/image.jpg" />
            <p className="hint">
              Upload in the{" "}
              <Link href="/admin/media" target="_blank" className="underline">
                media library
              </Link>{" "}
              and paste the URL. 1200×675 or larger recommended.
            </p>
            <label htmlFor="coverAlt" className="label mt-3">
              Alt text
            </label>
            <input id="coverAlt" name="coverAlt" value={v.coverAlt} onChange={(e) => set("coverAlt", e.target.value)} className="input" />
            <FieldError msg={errors.coverAlt} />
            <label htmlFor="coverCaption" className="label mt-3">
              Caption / credit
            </label>
            <input id="coverCaption" name="coverCaption" value={v.coverCaption} onChange={(e) => set("coverCaption", e.target.value)} className="input" />
          </div>

          <div className="rounded-lg border border-line bg-white p-5">
            <h2 className="mb-3 font-semibold text-ink">Search appearance</h2>
            <div className="mb-4 rounded-md bg-paper p-3">
              <p className="truncate text-xs text-emerald-800">{siteUrl + path}</p>
              <p className="line-clamp-1 text-[15px] text-[#1a0dab]">{serpTitle}</p>
              <p className="line-clamp-2 text-xs text-steel">{serpDesc}</p>
            </div>
            <label htmlFor="seoTitle" className="label">
              SEO title <Counter value={v.seoTitle} max={70} ideal={[30, 60]} />
            </label>
            <input id="seoTitle" name="seoTitle" value={v.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} className="input" placeholder="Defaults to the headline" />
            <FieldError msg={errors.seoTitle} />
            <label htmlFor="seoDescription" className="label mt-3">
              Meta description <Counter value={v.seoDescription} max={170} ideal={[120, 160]} />
            </label>
            <textarea id="seoDescription" name="seoDescription" rows={3} value={v.seoDescription} onChange={(e) => set("seoDescription", e.target.value)} className="input" placeholder="Defaults to the excerpt" />
            <FieldError msg={errors.seoDescription} />
            <label htmlFor="canonicalUrl" className="label mt-3">
              Canonical URL override
            </label>
            <input id="canonicalUrl" name="canonicalUrl" value={v.canonicalUrl} onChange={(e) => set("canonicalUrl", e.target.value)} className="input" placeholder="Only for syndicated content" />
            <FieldError msg={errors.canonicalUrl} />
            <label className="mt-3 flex items-center gap-2 text-sm">
              <input type="checkbox" name="noindex" checked={v.noindex} onChange={(e) => set("noindex", e.target.checked)} /> Hide from search engines (noindex)
            </label>
          </div>

          <div className="rounded-lg border border-line bg-white p-5">
            <h2 className="mb-3 font-semibold text-ink">Quality checklist</h2>
            <ul className="space-y-1.5 text-sm">
              {checks.map((c) => (
                <li key={c.label} className="flex gap-2">
                  <span aria-hidden="true" className={c.ok ? "text-emerald-600" : "text-amber-600"}>
                    {c.ok ? "✓" : "•"}
                  </span>
                  <span className={c.ok ? "text-steel" : "text-ink"}>{c.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </form>
  );
}
