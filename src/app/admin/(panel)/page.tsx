import Link from "next/link";
import { db } from "@/lib/db";
import { postPath } from "@/lib/site";
import { formatDateTime } from "@/lib/utils";

export const metadata = { title: "Dashboard" };

export default async function Dashboard() {
  const now = new Date();
  const [published, drafts, scheduled, subscribers, unread, recent, messages] = await Promise.all([
    db.post.count({ where: { status: "PUBLISHED", publishedAt: { lte: now } } }),
    db.post.count({ where: { status: "DRAFT" } }),
    db.post.count({ where: { status: "PUBLISHED", publishedAt: { gt: now } } }),
    db.subscriber.count(),
    db.contactMessage.count({ where: { read: false } }),
    db.post.findMany({ orderBy: { updatedAt: "desc" }, take: 8, include: { author: { select: { name: true } } } }),
    db.contactMessage.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
  ]);

  const stats = [
    { label: "Published", value: published, href: "/admin/posts?status=PUBLISHED" },
    { label: "Scheduled", value: scheduled, href: "/admin/posts?status=SCHEDULED" },
    { label: "Drafts", value: drafts, href: "/admin/posts?status=DRAFT" },
    { label: "Subscribers", value: subscribers, href: "/admin/subscribers" },
    { label: "Unread messages", value: unread, href: "/admin/messages" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-ink">Dashboard</h1>
        <Link href="/admin/posts/new" className="btn-primary">
          + New article
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="rounded-lg border border-line bg-white p-5 hover:border-brand">
            <p className="text-sm text-muted">{s.label}</p>
            <p className="mt-1 text-3xl font-semibold text-ink">{s.value}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-lg border border-line bg-white lg:col-span-2">
          <h2 className="border-b border-line px-5 py-3 font-semibold">Recently edited</h2>
          <ul className="divide-y divide-line">
            {recent.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-4 px-5 py-3 text-sm">
                <div className="min-w-0">
                  <Link href={`/admin/posts/${p.id}`} className="block truncate font-medium text-ink hover:text-brand">
                    {p.title}
                  </Link>
                  <p className="text-xs text-muted">
                    {p.type} · {p.author.name} · edited {formatDateTime(p.updatedAt)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className={`rounded px-2 py-0.5 text-xs ${p.status === "PUBLISHED" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"}`}>{p.status}</span>
                  {p.status === "PUBLISHED" && (
                    <Link href={postPath(p)} target="_blank" className="text-xs text-brand">
                      View ↗
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-lg border border-line bg-white">
          <h2 className="border-b border-line px-5 py-3 font-semibold">Latest messages</h2>
          <ul className="divide-y divide-line">
            {messages.length === 0 && <li className="px-5 py-4 text-sm text-muted">No messages yet.</li>}
            {messages.map((m) => (
              <li key={m.id} className="px-5 py-3 text-sm">
                <p className={m.read ? "text-steel" : "font-semibold text-ink"}>{m.subject}</p>
                <p className="text-xs text-muted">
                  {m.name} · {formatDateTime(m.createdAt)}
                </p>
              </li>
            ))}
          </ul>
          <Link href="/admin/messages" className="block border-t border-line px-5 py-3 text-sm text-brand">
            All messages →
          </Link>
        </section>
      </div>

      <section className="rounded-lg border border-line bg-white p-5 text-sm text-steel">
        <h2 className="font-semibold text-ink">SEO & GEO endpoints</h2>
        <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1">
          {["/sitemap.xml", "/news-sitemap.xml", "/robots.txt", "/rss.xml", "/feed.json", "/llms.txt", "/llms-full.txt"].map((p) => (
            <li key={p}>
              <a href={p} target="_blank" className="text-brand hover:underline">
                {p}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
