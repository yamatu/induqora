import { timingSafeEqual } from "node:crypto";
import { revalidateAllSiteContent } from "@/lib/revalidate";

export const dynamic = "force-dynamic";

function authorized(provided: string | null) {
  const secret = process.env.AUTH_SECRET;
  if (!secret || !provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Purges every cached page and feed. Called by scripts/publish-posts.sh after
// Markdown has been seeded, and by the container entrypoint on startup so pages
// prerendered against an empty database are re-rendered from live data.
export async function POST(req: Request) {
  if (!authorized(req.headers.get("x-revalidate-secret"))) {
    return Response.json({ ok: false }, { status: 401 });
  }

  let slug: string | undefined;
  try {
    const body = (await req.json()) as { slug?: string } | null;
    slug = body?.slug;
  } catch {
    // No JSON body supplied: purge everything.
  }

  const result = await revalidateAllSiteContent(slug);
  return Response.json({ ok: true, ...result });
}
