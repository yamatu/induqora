import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { NewsletterForm } from "@/components/NewsletterForm";
import { PostCard, PostCardFeature, PostListItem } from "@/components/PostCard";
import { db } from "@/lib/db";
import { cardInclude, publishedWhere } from "@/lib/posts";
import { collectionJsonLd, graph, pageMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

export const revalidate = 300;

const homeDescription =
  "Independent industrial automation news, technical guides and OT security analysis covering PLCs, DCS, SCADA, industrial networking, drives, robotics and IIoT.";

export const metadata: Metadata = pageMetadata({
  title: `${siteConfig.name} — Industrial Automation & Control News and Guides`,
  description: homeDescription,
  path: "/",
  absoluteTitle: true,
});

function SectionHeader({ title, href, linkLabel }: { title: string; href: string; linkLabel: string }) {
  return (
    <div className="mb-8 flex items-end justify-between border-b-2 border-ink pb-3">
      <h2 className="text-2xl font-bold text-ink">{title}</h2>
      <Link href={href} className="text-sm font-semibold text-brand hover:underline">
        {linkLabel} →
      </Link>
    </div>
  );
}

export default async function HomePage() {
  const [featured, latestNews, latestBlog, categories] = await Promise.all([
    db.post.findFirst({ where: publishedWhere({ featured: true }), include: cardInclude, orderBy: { publishedAt: "desc" } }),
    db.post.findMany({ where: publishedWhere({ type: "NEWS" }), include: cardInclude, orderBy: { publishedAt: "desc" }, take: 9 }),
    db.post.findMany({ where: publishedWhere({ type: "BLOG" }), include: cardInclude, orderBy: { publishedAt: "desc" }, take: 7 }),
    db.category.findMany({
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { posts: { where: publishedWhere() } } } },
    }),
  ]);

  const hero = featured ?? latestBlog[0] ?? latestNews[0];
  const sideNews = latestNews.filter((p) => p.id !== hero?.id).slice(0, 5);
  const newsGrid = latestNews.filter((p) => p.id !== hero?.id && !sideNews.includes(p)).slice(0, 3);
  const blogGrid = latestBlog.filter((p) => p.id !== hero?.id).slice(0, 6);
  const listedPosts = [hero, ...sideNews, ...newsGrid, ...blogGrid].filter((p): p is NonNullable<typeof p> => Boolean(p));

  return (
    <div className="container-page pt-8">
      <JsonLd
        data={graph(
          collectionJsonLd({
            name: `${siteConfig.name} — ${siteConfig.tagline}`,
            description: homeDescription,
            path: "/",
            items: listedPosts,
          }),
        )}
      />
      <section className="mb-10 max-w-3xl">
        <h1 className="font-serif text-2xl font-bold text-ink sm:text-3xl">Industrial automation and control — news, guides and engineering analysis</h1>
        <p className="mt-2 text-steel">
          Independent coverage of PLCs, DCS, SCADA, industrial networks, OT cybersecurity, motion control, robotics and IIoT, written for the engineers who build and run modern plants.
        </p>
      </section>

      {hero && (
        <section aria-label="Top stories" className="grid gap-8 lg:grid-cols-3">
          <div className="min-h-[360px] lg:col-span-2">
            <PostCardFeature post={hero} />
          </div>
          <div>
            <div className="flex items-center justify-between border-b-2 border-ink pb-2">
              <h2 className="text-lg font-bold text-ink">Latest news</h2>
              <Link href="/news" className="text-xs font-semibold text-brand hover:underline">
                All news →
              </Link>
            </div>
            {sideNews.length ? sideNews.map((p) => <PostListItem key={p.id} post={p} />) : <p className="py-4 text-sm text-muted">News coverage is coming soon.</p>}
          </div>
        </section>
      )}

      {newsGrid.length > 0 && (
        <section className="mt-16">
          <SectionHeader title="More news" href="/news" linkLabel="All news" />
          <div className="grid gap-10 md:grid-cols-3">
            {newsGrid.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        </section>
      )}

      {blogGrid.length > 0 && (
        <section className="mt-16">
          <SectionHeader title="Insights & technical guides" href="/blog" linkLabel="All insights" />
          <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {blogGrid.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-16">
        <SectionHeader title="Explore by topic" href="/topics" linkLabel="All topics" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((c) => (
            <Link key={c.id} href={`/category/${c.slug}`} className="group rounded-lg border border-line p-5 transition-colors hover:border-brand hover:bg-paper">
              <h3 className="font-semibold text-ink group-hover:text-brand">{c.name}</h3>
              <p className="mt-2 line-clamp-3 text-sm leading-6 text-steel">{c.description}</p>
              <p className="mt-3 text-xs text-muted">
                {c._count.posts} {c._count.posts === 1 ? "article" : "articles"}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-16 grid items-center gap-6 rounded-xl bg-ink p-8 text-white md:grid-cols-2 md:p-10">
        <div>
          <h2 className="text-2xl font-bold">The Induqora Briefing</h2>
          <p className="mt-2 text-slate-300">
            One email a week with the automation stories that matter — product launches, vulnerability advisories, standards changes and practical engineering guidance.
          </p>
        </div>
        <NewsletterForm source="home" dark />
      </section>
    </div>
  );
}
