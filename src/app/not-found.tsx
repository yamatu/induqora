import Link from "next/link";
import { Logo } from "@/components/Logo";

export const metadata = { title: "Page not found", robots: { index: false } };

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <Link href="/" aria-label="Induqora home">
        <Logo />
      </Link>
      <p className="mt-10 text-sm font-semibold tracking-wider text-brand">404</p>
      <h1 className="mt-2 font-serif text-3xl font-bold text-ink">We couldn’t find that page</h1>
      <p className="mt-4 max-w-md text-steel">The article may have moved or been unpublished. Try searching, or start from the latest coverage.</p>
      <form action="/search" method="get" role="search" className="mt-8 flex w-full max-w-md gap-2">
        <label htmlFor="nf-search" className="sr-only">
          Search articles
        </label>
        <input id="nf-search" name="q" type="search" placeholder="Search Induqora…" className="input flex-1" />
        <button type="submit" className="btn-primary">
          Search
        </button>
      </form>
      <p className="mt-6 flex gap-4 text-sm">
        <Link href="/news" className="text-brand hover:underline">
          Latest news
        </Link>
        <Link href="/blog" className="text-brand hover:underline">
          Insights
        </Link>
        <Link href="/topics" className="text-brand hover:underline">
          Topics
        </Link>
      </p>
    </div>
  );
}
