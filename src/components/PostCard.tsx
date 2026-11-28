import Image from "next/image";
import Link from "next/link";
import type { PostCardData } from "@/lib/posts";
import { POST_TYPES, postPath, type PostType } from "@/lib/site";
import { formatDate } from "@/lib/utils";

// Covers are 1200x675 JPEGs served from /media. next/image turns them into sized srcset
// entries (WebP/AVIF) so a card only downloads what its slot actually needs.
const CARD_SIZES = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw";
const FEATURE_SIZES = "(min-width: 1024px) 66vw, 100vw";

function Meta({ post }: { post: PostCardData }) {
  return (
    <p className="mt-3 flex flex-wrap items-center gap-x-2 text-xs text-muted">
      <time dateTime={post.publishedAt?.toISOString()}>{formatDate(post.publishedAt)}</time>
      <span aria-hidden="true">·</span>
      <span>{post.readingMinutes} min read</span>
    </p>
  );
}

function Kicker({ post }: { post: PostCardData }) {
  const typeLabel = POST_TYPES[post.type as PostType]?.label ?? "Insights";
  return (
    <p className="flex items-center gap-2">
      <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${post.type === "NEWS" ? "bg-accent/15 text-amber-800" : "bg-brand/10 text-brand"}`}>
        {typeLabel}
      </span>
      <span className="kicker">{post.category.name}</span>
    </p>
  );
}

export function PostCard({ post, headingLevel = 3 }: { post: PostCardData; headingLevel?: 2 | 3 }) {
  const H = `h${headingLevel}` as "h2" | "h3";
  return (
    <article className="group flex flex-col">
      {post.coverImage && (
        <Link href={postPath(post)} tabIndex={-1} aria-hidden="true" className="mb-4 block overflow-hidden rounded-lg bg-paper">
          <Image
            src={post.coverImage}
            alt=""
            width={640}
            height={360}
            sizes={CARD_SIZES}
            className="aspect-video w-full object-cover transition-transform group-hover:scale-[1.02]"
          />
        </Link>
      )}
      <Kicker post={post} />
      <H className="mt-2 text-lg leading-snug font-semibold text-ink">
        <Link href={postPath(post)} className="hover:text-brand">
          {post.title}
        </Link>
      </H>
      <p className="mt-2 line-clamp-3 text-sm leading-6 text-steel">{post.excerpt}</p>
      <Meta post={post} />
    </article>
  );
}

export function PostCardFeature({ post }: { post: PostCardData }) {
  return (
    <article className="relative flex h-full flex-col justify-end overflow-hidden rounded-xl bg-ink p-6 text-white sm:p-8">
      {post.coverImage ? (
        <>
          <Image
            src={post.coverImage}
            alt=""
            fill
            sizes={FEATURE_SIZES}
            loading="eager"
            fetchPriority="high"
            className="object-cover opacity-40"
          />
        </>
      ) : (
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(11,92,173,0.55),transparent_55%),radial-gradient(circle_at_10%_90%,rgba(245,158,11,0.25),transparent_45%)]" />
      )}
      <div className="relative">
        <p className="text-xs font-semibold uppercase tracking-wider text-amber-400">
          {post.type === "NEWS" ? "News" : "Insights"} · {post.category.name}
        </p>
        <h2 className="mt-3 text-2xl leading-tight font-bold sm:text-3xl">
          <Link href={postPath(post)} className="hover:underline">
            {post.title}
          </Link>
        </h2>
        <p className="mt-3 max-w-2xl text-slate-200">{post.excerpt}</p>
        <p className="mt-4 text-xs text-slate-300">
          By {post.author.name} · <time dateTime={post.publishedAt?.toISOString()}>{formatDate(post.publishedAt)}</time> · {post.readingMinutes} min read
        </p>
      </div>
    </article>
  );
}

export function PostListItem({ post }: { post: PostCardData }) {
  return (
    <article className="border-b border-line py-4 last:border-0">
      <p className="kicker">{post.category.name}</p>
      <h3 className="mt-1 font-semibold leading-snug">
        <Link href={postPath(post)} className="hover:text-brand">
          {post.title}
        </Link>
      </h3>
      <p className="mt-1 text-xs text-muted">
        <time dateTime={post.publishedAt?.toISOString()}>{formatDate(post.publishedAt)}</time>
      </p>
    </article>
  );
}

export function PostGrid({ posts, headingLevel = 3 }: { posts: PostCardData[]; headingLevel?: 2 | 3 }) {
  if (!posts.length) return <p className="py-10 text-center text-muted">No articles published here yet.</p>;
  return (
    <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((p) => (
        <PostCard key={p.id} post={p} headingLevel={headingLevel} />
      ))}
    </div>
  );
}
