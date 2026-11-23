import Link from "next/link";
import { db } from "@/lib/db";
import { siteConfig } from "@/lib/site";
import { LogoMark } from "./Logo";
import { NewsletterForm } from "./NewsletterForm";

export async function SiteFooter() {
  const categories = await db.category.findMany({ orderBy: { sortOrder: "asc" }, select: { slug: true, name: true } });
  const year = new Date().getFullYear();

  return (
    <footer className="mt-20 bg-ink text-slate-300">
      <div className="container-page grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <Link href="/" className="flex items-center gap-2 text-white">
            <LogoMark />
            <span className="text-xl font-bold">Induqora</span>
          </Link>
          <p className="mt-4 text-sm leading-6 text-slate-400">{siteConfig.description}</p>
        </div>

        <nav aria-label="Topics">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-white">Topics</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link href={`/category/${c.slug}`} className="hover:text-white">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Company">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-white">Induqora</h2>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link href="/news" className="hover:text-white">
                Latest News
              </Link>
            </li>
            <li>
              <Link href="/blog" className="hover:text-white">
                Insights & Guides
              </Link>
            </li>
            {siteConfig.footerNav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="hover:text-white">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-white">The Induqora Briefing</h2>
          <p className="mt-4 mb-4 text-sm text-slate-400">
            A weekly email for controls engineers, OT security teams and plant leaders. No spam — unsubscribe anytime.
          </p>
          <NewsletterForm source="footer" dark />
          <p className="mt-6 text-sm">
            <a href="/rss.xml" className="hover:text-white">
              RSS feed
            </a>
            <span className="mx-2 text-slate-600">·</span>
            <a href="/feed.json" className="hover:text-white">
              JSON Feed
            </a>
          </p>
        </div>
      </div>
      <div className="border-t border-slate-800">
        <div className="container-page flex flex-col gap-2 py-6 text-xs text-slate-500 sm:flex-row sm:justify-between">
          <p>
            © {year} {siteConfig.name}. All rights reserved.
          </p>
          <p>Independent coverage of industrial automation and control.</p>
        </div>
      </div>
    </footer>
  );
}
