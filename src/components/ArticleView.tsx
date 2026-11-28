import Image from "next/image";
import Link from "next/link";
import type { Author, Category, Post, Tag } from "@prisma/client";
import type { PostCardData } from "@/lib/posts";
import type { TocItem } from "@/lib/markdown";
import { POST_TYPES, absoluteUrl, postPath, type PostType } from "@/lib/site";
import { formatDate, parseJsonArray, parseLines, type Faq, type Source } from "@/lib/utils";
import { Breadcrumbs } from "./Breadcrumbs";
import { NewsletterForm } from "./NewsletterForm";
import { PostCard } from "./PostCard";

type FullPost = Post & { author: Author; category: Category; tags: Tag[] };
type Adjacent = { slug: string; title: string; type: string } | null;

export function articleBreadcrumbs(post: FullPost) {
  const section = POST_TYPES[post.type as PostType] ?? POST_TYPES.BLOG;
  return [
    { name: "Home", path: "/" },
    { name: section.label, path: section.path },
    { name: post.category.name, path: `/category/${post.category.slug}` },
    { name: post.title, path: postPath(post) },
  ];
}

function TableOfContents({ toc }: { toc: TocItem[] }) {
  if (toc.length < 3) return null;
  return (
    <nav aria-label="Table of contents" className="text-sm">
      <p className="mb-3 font-semibold text-ink">In this article</p>
      <ol className="space-y-2 border-l border-line">
        {toc.map((item) => (
          <li key={item.id} className={item.depth === 3 ? "pl-7" : "pl-4"}>
            <a href={`#${item.id}`} className="block text-steel hover:text-brand">
              {item.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

function ShareLinks({ url, title, slug }: { url: string; title: string; slug: string }) {
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);
  const links = [
    { label: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}` },
    { label: "X", href: `https://x.com/intent/post?url=${u}&text=${t}` },
    { label: "Email", href: `mailto:?subject=${t}&body=${u}` },
  ];
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="font-medium text-steel">Share:</span>
      {links.map((l) => (
        <a key={l.label} href={l.href} target="_blank" rel="noopener nofollow" className="rounded-md border border-line px-3 py-1 hover:bg-paper">
          {l.label}
        </a>
      ))}
      <a href={`/md/${slug}`} className="rounded-md border border-line px-3 py-1 text-muted hover:bg-paper hover:text-ink" title="Clean Markdown for AI tools and engineers">
        Markdown
      </a>
    </div>
  );
}

export function ArticleView({
  post,
  html,
  toc,
  related,
  adjacent,
  preview = false,
  commercialLinks = false,
}: {
  post: FullPost;
  html: string;
  toc: TocItem[];
  related: PostCardData[];
  adjacent: { prev: Adjacent; next: Adjacent };
  preview?: boolean;
  commercialLinks?: boolean;
}) {
  const takeaways = parseLines(post.keyTakeaways);
  const faqs = parseJsonArray<Faq>(post.faqs).filter((f) => f.q && f.a);
  const sources = parseJsonArray<Source>(post.sources).filter((s) => s.title);
  const section = POST_TYPES[post.type as PostType] ?? POST_TYPES.BLOG;
  const wasUpdated = post.publishedAt && post.modifiedAt.getTime() - post.publishedAt.getTime() > 24 * 3600 * 1000;

  return (
    <article className="container-page pt-8">
      {preview && (
        <div className="mb-6 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Preview mode — this is how the article will look once published. Status: <strong>{post.status}</strong>
        </div>
      )}

      <div className="mx-auto max-w-3xl">
        <Breadcrumbs items={articleBreadcrumbs(post)} />

        <header className="mt-6">
          <p className="flex items-center gap-2">
            <Link href={section.path} className="rounded bg-ink px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white">
              {section.label}
            </Link>
            <Link href={`/category/${post.category.slug}`} className="kicker hover:underline">
              {post.category.name}
            </Link>
          </p>
          <h1 className="mt-4 font-serif text-3xl leading-tight font-bold text-ink sm:text-4xl lg:text-[2.75rem]">{post.title}</h1>
          {post.excerpt && <p className="article-excerpt mt-4 text-lg leading-8 text-steel sm:text-xl">{post.excerpt}</p>}

          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 border-y border-line py-4 text-sm">
            <div className="flex items-center gap-3">
              {post.author.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={post.author.avatarUrl} alt="" width={40} height={40} className="h-10 w-10 rounded-full object-cover" />
              ) : (
                <span aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 font-semibold text-brand">
                  {post.author.name.charAt(0)}
                </span>
              )}
              <div>
                <p>
                  By{" "}
                  <Link href={`/author/${post.author.slug}`} rel="author" className="font-semibold text-ink hover:text-brand">
                    {post.author.name}
                  </Link>
                </p>
                {post.author.jobTitle && <p className="text-xs text-muted">{post.author.jobTitle}</p>}
              </div>
            </div>
            <div className="text-muted sm:ml-auto sm:text-right">
              <p>
                Published <time dateTime={post.publishedAt?.toISOString()}>{formatDate(post.publishedAt)}</time>
                {wasUpdated && (
                  <>
                    {" "}
                    · Updated <time dateTime={post.modifiedAt.toISOString()}>{formatDate(post.modifiedAt)}</time>
                  </>
                )}
              </p>
              <p className="text-xs">{post.readingMinutes} min read</p>
            </div>
          </div>
        </header>

        {post.coverImage && (
          <figure className="mt-8">
            <Image
              src={post.coverImage}
              alt={post.coverAlt || post.title}
              width={1200}
              height={675}
              sizes="(min-width: 1024px) 768px, 100vw"
              loading="eager"
              fetchPriority="high"
              className="aspect-video w-full rounded-lg object-cover"
            />
            {post.coverCaption && <figcaption className="mt-2 text-center text-sm text-muted">{post.coverCaption}</figcaption>}
          </figure>
        )}

        {takeaways.length > 0 && (
          <aside aria-labelledby="key-takeaways" className="mt-8 rounded-lg border-l-4 border-accent bg-paper p-5 sm:p-6">
            <h2 id="key-takeaways" className="text-base font-bold uppercase tracking-wide text-ink">
              Key takeaways
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-[15px] leading-7 text-steel marker:text-accent">
              {takeaways.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </aside>
        )}
      </div>

      <div className="mx-auto mt-10 grid max-w-6xl grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_240px]">
        <div className="mx-auto w-full max-w-3xl min-w-0 lg:mr-0">
          {commercialLinks && (
            <p className="mb-8 rounded-md border-l-4 border-accent bg-paper px-4 py-3 text-sm leading-6 text-steel">
              <strong className="font-semibold text-ink">Supplier mention.</strong> This article references commercial
              suppliers by name. Links to their sites are provided for reference and are marked{" "}
              <code className="text-xs">nofollow</code>; they are not an independent endorsement. See our{" "}
              <Link href="/editorial-policy" className="text-brand hover:underline">
                editorial policy
              </Link>
              .
            </p>
          )}
          <div className="article-body prose prose-lg prose-slate max-w-none prose-headings:font-semibold prose-a:text-brand prose-pre:bg-slate-900" dangerouslySetInnerHTML={{ __html: html }} />

          {faqs.length > 0 && (
            <section aria-labelledby="faq" className="mt-12">
              <h2 id="faq" className="text-2xl font-semibold text-ink">
                Frequently asked questions
              </h2>
              <div className="mt-4 divide-y divide-line rounded-lg border border-line">
                {faqs.map((f) => (
                  <details key={f.q} className="group p-5" open>
                    <summary className="cursor-pointer list-none font-semibold text-ink [&::-webkit-details-marker]:hidden">
                      <h3 className="inline">{f.q}</h3>
                    </summary>
                    <p className="mt-3 leading-7 text-steel">{f.a}</p>
                  </details>
                ))}
              </div>
            </section>
          )}

          {sources.length > 0 && (
            <section aria-labelledby="sources" className="mt-12">
              <h2 id="sources" className="text-lg font-semibold text-ink">
                Sources and further reading
              </h2>
              <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-steel">
                {sources.map((s) => (
                  <li key={s.title + s.url}>
                    {s.url ? (
                      <a href={s.url} target="_blank" rel="noopener" className="text-brand hover:underline">
                        {s.title}
                      </a>
                    ) : (
                      s.title
                    )}
                  </li>
                ))}
              </ol>
            </section>
          )}

          <div className="mt-10 flex flex-col gap-4 border-t border-line pt-6">
            {post.tags.length > 0 && (
              <ul className="flex flex-wrap gap-2" aria-label="Tags">
                {post.tags.map((t) => (
                  <li key={t.id}>
                    <Link href={`/tag/${t.slug}`} rel="tag" className="rounded-full bg-paper px-3 py-1 text-sm text-steel ring-1 ring-line hover:text-brand">
                      #{t.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <ShareLinks url={absoluteUrl(postPath(post))} title={post.title} slug={post.slug} />
          </div>

          <section aria-label="About the author" className="mt-10 flex gap-4 rounded-lg bg-paper p-6">
            {post.author.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={post.author.avatarUrl} alt="" width={64} height={64} className="h-16 w-16 shrink-0 rounded-full object-cover" />
            ) : (
              <span aria-hidden="true" className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xl font-semibold text-brand">
                {post.author.name.charAt(0)}
              </span>
            )}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">About the author</p>
              <p className="mt-1 font-semibold text-ink">
                <Link href={`/author/${post.author.slug}`} className="hover:text-brand">
                  {post.author.name}
                </Link>
                {post.author.jobTitle && <span className="font-normal text-muted"> — {post.author.jobTitle}</span>}
              </p>
              {post.author.bio && <p className="mt-2 text-sm leading-6 text-steel">{post.author.bio}</p>}
            </div>
          </section>

          <p className="mt-6 text-xs leading-5 text-muted">
            Spotted an error? Induqora corrects factual mistakes promptly — see our{" "}
            <Link href="/editorial-policy#corrections" className="underline">
              corrections policy
            </Link>{" "}
            or{" "}
            <Link href="/contact" className="underline">
              contact the editors
            </Link>
            .
          </p>

          {(adjacent.prev || adjacent.next) && (
            <nav aria-label="More stories" className="mt-10 grid gap-4 sm:grid-cols-2">
              {adjacent.prev ? (
                <Link href={postPath(adjacent.prev)} className="rounded-lg border border-line p-4 hover:border-brand">
                  <span className="text-xs text-muted">← Previous</span>
                  <span className="mt-1 block font-medium text-ink">{adjacent.prev.title}</span>
                </Link>
              ) : (
                <span />
              )}
              {adjacent.next && (
                <Link href={postPath(adjacent.next)} className="rounded-lg border border-line p-4 text-right hover:border-brand">
                  <span className="text-xs text-muted">Next →</span>
                  <span className="mt-1 block font-medium text-ink">{adjacent.next.title}</span>
                </Link>
              )}
            </nav>
          )}
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-28 space-y-8">
            <TableOfContents toc={toc} />
          </div>
        </aside>
      </div>

      {related.length > 0 && (
        <section aria-labelledby="related" className="mx-auto mt-16 max-w-6xl border-t border-line pt-10">
          <h2 id="related" className="mb-8 text-2xl font-semibold text-ink">
            Related coverage
          </h2>
          <div className="grid gap-10 md:grid-cols-3">
            {related.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto mt-16 max-w-3xl rounded-xl bg-ink p-8 text-white">
        <h2 className="text-xl font-semibold">Get the Induqora Briefing</h2>
        <p className="mt-2 mb-5 text-sm text-slate-300">
          The week’s most important industrial automation news and engineering analysis, in one email.
        </p>
        <NewsletterForm source={`article:${post.slug}`} dark />
      </section>
    </article>
  );
}
