import type { Metadata } from "next";
import { Pagination } from "@/components/Pagination";
import { PostGrid } from "@/components/PostCard";
import { searchPosts } from "@/lib/posts";
import { clampPage } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ q?: string; page?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const q = ((await searchParams).q || "").trim();
  return {
    title: q ? `Search results for “${q.slice(0, 60)}”` : "Search",
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage({ searchParams }: Props) {
  const sp = await searchParams;
  const q = (sp.q || "").trim().slice(0, 100);
  const page = clampPage(sp.page);
  const { posts, total, totalPages } = q ? await searchPosts(q, page) : { posts: [], total: 0, totalPages: 1 };

  return (
    <div className="container-page pt-8">
      <h1 className="font-serif text-3xl font-bold text-ink">Search</h1>
      <form action="/search" method="get" role="search" className="mt-6 flex max-w-2xl gap-2">
        <label htmlFor="q" className="sr-only">
          Search query
        </label>
        <input id="q" name="q" type="search" defaultValue={q} placeholder="e.g. OPC UA security, PID tuning, IEC 62443" className="input flex-1 text-base" />
        <button type="submit" className="btn-primary">
          Search
        </button>
      </form>
      {q && (
        <p className="mt-6 mb-10 text-steel" role="status">
          {total === 0 ? (
            <>No articles match “{q}”. Try a broader term such as “PLC”, “SCADA” or “cybersecurity”.</>
          ) : (
            <>
              {total} {total === 1 ? "result" : "results"} for “{q}”
            </>
          )}
        </p>
      )}
      {posts.length > 0 && <PostGrid posts={posts} headingLevel={2} />}
      <Pagination basePath="/search" page={page} totalPages={totalPages} extra={{ q }} />
    </div>
  );
}
