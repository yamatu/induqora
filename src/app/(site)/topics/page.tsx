import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { db } from "@/lib/db";
import { publishedWhere } from "@/lib/posts";
import { breadcrumbJsonLd, graph, linkListCollectionJsonLd, pageMetadata } from "@/lib/seo";
import { postPath } from "@/lib/site";

export const revalidate = 300;

const description =
  "Browse Induqora coverage by discipline: PLCs, DCS, SCADA, industrial networking, OT cybersecurity, motion control, robotics, IIoT and standards.";

export const metadata: Metadata = pageMetadata({
  title: "Topics",
  description,
  path: "/topics",
});

export default async function TopicsPage() {
  const [categories, tags] = await Promise.all([
    db.category.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        _count: { select: { posts: { where: publishedWhere() } } },
        posts: { where: publishedWhere(), orderBy: { publishedAt: "desc" }, take: 3, select: { title: true, slug: true, type: true } },
      },
    }),
    db.tag.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { posts: { where: publishedWhere() } } } },
    }),
  ]);

  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Topics", path: "/topics" },
  ];

  const ld = graph(
    linkListCollectionJsonLd({
      name: "Industrial Automation Topics",
      description,
      path: "/topics",
      items: categories.map((c) => ({ path: `/category/${c.slug}`, name: c.name, description: c.description })),
    }),
    breadcrumbJsonLd(crumbs),
  );

  return (
    <div className="container-page pt-8">
      <JsonLd data={ld} />
      <Breadcrumbs items={crumbs} />
      <header className="mt-6 mb-12 max-w-3xl">
        <h1 className="font-serif text-3xl font-bold text-ink sm:text-4xl">Topics</h1>
        <p className="mt-4 text-lg leading-8 text-steel">
          Induqora organizes its coverage around the core disciplines of industrial automation and control. Pick a topic to see every news story and technical guide we have published on it.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {categories.map((c) => (
          <section key={c.id} className="rounded-lg border border-line p-6">
            <h2 className="text-xl font-semibold">
              <Link href={`/category/${c.slug}`} className="text-ink hover:text-brand">
                {c.name}
              </Link>
              <span className="ml-2 text-sm font-normal text-muted">({c._count.posts})</span>
            </h2>
            <p className="mt-2 text-sm leading-6 text-steel">{c.description}</p>
            {c.posts.length > 0 && (
              <ul className="mt-4 space-y-1 text-sm">
                {c.posts.map((p) => (
                  <li key={p.slug}>
                    <Link href={postPath(p)} className="text-brand hover:underline">
                      {p.title}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>

      {tags.length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl font-bold text-ink">Tags</h2>
          <ul className="mt-6 flex flex-wrap gap-2">
            {tags
              .filter((t) => t._count.posts > 0)
              .map((t) => (
                <li key={t.id}>
                  <Link href={`/tag/${t.slug}`} className="inline-block rounded-full bg-paper px-3 py-1 text-sm text-steel ring-1 ring-line hover:text-brand">
                    {t.name} <span className="text-muted">({t._count.posts})</span>
                  </Link>
                </li>
              ))}
          </ul>
        </section>
      )}
    </div>
  );
}
