import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { db } from "@/lib/db";
import { publishedWhere } from "@/lib/posts";
import { breadcrumbJsonLd, graph, pageMetadata } from "@/lib/seo";

export const revalidate = 300;

export const metadata: Metadata = pageMetadata({
  title: "Authors and Editors",
  description: "Meet the engineers, analysts and editors who write for Induqora and the expertise they bring to industrial automation coverage.",
  path: "/authors",
});

export default async function AuthorsPage() {
  const authors = await db.author.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { posts: { where: publishedWhere() } } } },
  });
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Authors", path: "/authors" },
  ];

  return (
    <div className="container-page pt-8">
      <JsonLd data={graph(breadcrumbJsonLd(crumbs))} />
      <Breadcrumbs items={crumbs} />
      <header className="mt-6 mb-12 max-w-3xl">
        <h1 className="font-serif text-3xl font-bold text-ink sm:text-4xl">Authors and editors</h1>
        <p className="mt-4 text-lg leading-8 text-steel">
          Every Induqora article carries a named byline. Author pages list each writer’s role, the topics they cover and where to find them elsewhere.
        </p>
      </header>
      <div className="grid gap-6 md:grid-cols-2">
        {authors.map((a) => (
          <Link key={a.id} href={`/author/${a.slug}`} className="flex gap-4 rounded-lg border border-line p-6 hover:border-brand">
            <span aria-hidden="true" className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xl font-semibold text-brand">
              {a.name.charAt(0)}
            </span>
            <div>
              <h2 className="font-semibold text-ink">{a.name}</h2>
              {a.jobTitle && <p className="text-sm text-muted">{a.jobTitle}</p>}
              <p className="mt-2 line-clamp-3 text-sm leading-6 text-steel">{a.bio}</p>
              <p className="mt-2 text-xs text-muted">{a._count.posts} published articles</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
