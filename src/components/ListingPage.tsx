import type { PostCardData } from "@/lib/posts";
import { breadcrumbJsonLd, collectionJsonLd, graph } from "@/lib/seo";
import { Breadcrumbs } from "./Breadcrumbs";
import { JsonLd } from "./JsonLd";
import { Pagination } from "./Pagination";
import { PostGrid } from "./PostCard";

export function ListingPage({
  title,
  kicker,
  description,
  path,
  crumbs,
  posts,
  page,
  totalPages,
  children,
}: {
  title: string;
  kicker?: string;
  description: string;
  path: string;
  crumbs: { name: string; path: string }[];
  posts: PostCardData[];
  page: number;
  totalPages: number;
  children?: React.ReactNode;
}) {
  return (
    <div className="container-page pt-8">
      <JsonLd data={graph(collectionJsonLd({ name: title, description, path, items: posts }), breadcrumbJsonLd(crumbs))} />
      <Breadcrumbs items={crumbs} />
      <header className="mt-6 mb-12 max-w-3xl">
        {kicker && <p className="kicker">{kicker}</p>}
        <h1 className="mt-2 font-serif text-3xl font-bold text-ink sm:text-4xl">
          {title}
          {page > 1 && <span className="text-muted"> — Page {page}</span>}
        </h1>
        <p className="mt-4 text-lg leading-8 text-steel">{description}</p>
        {children}
      </header>
      <PostGrid posts={posts} headingLevel={2} />
      <Pagination basePath={path} page={page} totalPages={totalPages} />
    </div>
  );
}
