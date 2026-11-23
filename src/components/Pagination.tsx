import Link from "next/link";

export function pageHref(basePath: string, page: number, extra: Record<string, string> = {}) {
  const params = new URLSearchParams(extra);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export function Pagination({ basePath, page, totalPages, extra }: { basePath: string; page: number; totalPages: number; extra?: Record<string, string> }) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2);

  return (
    <nav aria-label="Pagination" className="mt-14 flex items-center justify-center gap-1 text-sm">
      {page > 1 && (
        <Link href={pageHref(basePath, page - 1, extra)} rel="prev" className="rounded-md border border-line px-3 py-1.5 hover:bg-paper">
          ← Newer
        </Link>
      )}
      {pages.map((p, i) => (
        <span key={p} className="flex items-center">
          {i > 0 && p - pages[i - 1] > 1 && <span className="px-1 text-muted">…</span>}
          <Link
            href={pageHref(basePath, p, extra)}
            aria-current={p === page ? "page" : undefined}
            className={`rounded-md px-3 py-1.5 ${p === page ? "bg-ink text-white" : "border border-line hover:bg-paper"}`}
          >
            {p}
          </Link>
        </span>
      ))}
      {page < totalPages && (
        <Link href={pageHref(basePath, page + 1, extra)} rel="next" className="rounded-md border border-line px-3 py-1.5 hover:bg-paper">
          Older →
        </Link>
      )}
    </nav>
  );
}
