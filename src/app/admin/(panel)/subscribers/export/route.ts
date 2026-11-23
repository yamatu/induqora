import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

function csvCell(value: string) {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

export async function GET() {
  if (!(await getSession())) return new Response("Unauthorized", { status: 401 });
  const subscribers = await db.subscriber.findMany({ orderBy: { createdAt: "asc" } });
  const rows = [["email", "source", "subscribed_at"], ...subscribers.map((s) => [s.email, s.source, s.createdAt.toISOString()])];
  const csv = rows.map((r) => r.map(csvCell).join(",")).join("\r\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="induqora-subscribers-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
