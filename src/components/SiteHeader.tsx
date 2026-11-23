import Link from "next/link";
import { db } from "@/lib/db";
import { siteConfig } from "@/lib/site";
import { Logo } from "./Logo";

function SearchIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="9" cy="9" r="6" />
      <path d="M14 14l4 4" strokeLinecap="round" />
    </svg>
  );
}

export async function SiteHeader() {
  const categories = await db.category.findMany({ orderBy: { sortOrder: "asc" }, select: { slug: true, name: true } });

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2">
        Skip to content
      </a>
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/" aria-label={`${siteConfig.name} home`}>
          <Logo />
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-6 md:flex">
          {siteConfig.mainNav.map((item) => (
            <Link key={item.href} href={item.href} className="text-sm font-medium text-steel hover:text-brand">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <form action="/search" method="get" role="search" className="hidden items-center sm:flex">
            <label htmlFor="header-search" className="sr-only">
              Search articles
            </label>
            <input
              id="header-search"
              name="q"
              type="search"
              placeholder="Search PLC, OPC UA, IEC 62443…"
              className="w-56 rounded-l-md border border-r-0 border-slate-300 px-3 py-1.5 text-sm focus:border-brand focus:outline-none lg:w-72"
            />
            <button type="submit" className="rounded-r-md border border-brand bg-brand px-3 py-1.5 text-white hover:bg-brand-dark" aria-label="Search">
              <SearchIcon />
            </button>
          </form>

          <details className="relative md:hidden">
            <summary className="list-none rounded-md border border-line px-3 py-1.5 text-sm font-medium [&::-webkit-details-marker]:hidden">
              Menu
            </summary>
            <div className="absolute right-0 mt-2 w-64 rounded-lg border border-line bg-white p-4 shadow-lg">
              <form action="/search" method="get" role="search" className="mb-3">
                <label htmlFor="mobile-search" className="sr-only">
                  Search articles
                </label>
                <input id="mobile-search" name="q" type="search" placeholder="Search…" className="input" />
              </form>
              <nav aria-label="Mobile" className="flex flex-col gap-2">
                {siteConfig.mainNav.map((item) => (
                  <Link key={item.href} href={item.href} className="py-1 font-medium text-steel">
                    {item.label}
                  </Link>
                ))}
                <hr className="my-2 border-line" />
                {categories.map((c) => (
                  <Link key={c.slug} href={`/category/${c.slug}`} className="py-0.5 text-sm text-muted">
                    {c.name}
                  </Link>
                ))}
              </nav>
            </div>
          </details>
        </div>
      </div>

      {categories.length > 0 && (
        <nav aria-label="Topics" className="hidden border-t border-line bg-paper md:block">
          <ul className="container-page flex gap-5 overflow-x-auto py-2 text-[13px] whitespace-nowrap">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link href={`/category/${c.slug}`} className="text-steel hover:text-brand">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
