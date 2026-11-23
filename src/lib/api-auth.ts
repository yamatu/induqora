import { getSession } from "./auth";

export async function requireAdminApi(req: Request) {
  const origin = req.headers.get("origin");
  if (origin && req.method !== "GET") {
    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
    if (new URL(origin).host !== host) return { error: Response.json({ ok: false, message: "Cross-origin request rejected." }, { status: 403 }) };
  }
  const session = await getSession();
  if (!session) return { error: Response.json({ ok: false, message: "Please sign in again." }, { status: 401 }) };
  if (session.role !== "ADMIN") return { error: Response.json({ ok: false, message: "Administrator role required." }, { status: 403 }) };
  return { session };
}
