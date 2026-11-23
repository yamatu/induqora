import { timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

function authorized(provided: string | null) {
  const secret = process.env.AUTH_SECRET;
  if (!secret || !provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Purges every cached page and feed. Called by the container on startup so pages
// prerendered at build time (against an empty database) are re-rendered from live data.
export async function POST(req: Request) {
  if (!authorized(req.headers.get("x-revalidate-secret"))) {
    return Response.json({ ok: false }, { status: 401 });
  }
  revalidatePath("/", "layout");
  return Response.json({ ok: true, revalidatedAt: new Date().toISOString() });
}
