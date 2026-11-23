import { readFile } from "node:fs/promises";
import { requireAdminApi } from "@/lib/api-auth";
import { backupPath, buildBackup } from "@/lib/backup";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAdminApi(req);
  if (auth.error) return auth.error;

  const name = new URL(req.url).searchParams.get("name");
  let body: Buffer;
  let filename: string;
  if (name) {
    const p = backupPath(name);
    if (!p) return new Response("Not found", { status: 404 });
    body = await readFile(p).catch(() => Buffer.alloc(0));
    if (!body.length) return new Response("Not found", { status: 404 });
    filename = `induqora-${name}`;
  } else {
    body = await buildBackup();
    filename = `induqora-backup-${new Date().toISOString().slice(0, 19).replace(/[-:T]/g, "")}.json.gz`;
  }

  return new Response(new Uint8Array(body), {
    headers: {
      "Content-Type": "application/gzip",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
