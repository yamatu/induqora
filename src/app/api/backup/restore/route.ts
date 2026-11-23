import { readFile } from "node:fs/promises";
import { revalidatePath } from "next/cache";
import { requireAdminApi } from "@/lib/api-auth";
import { MAX_BACKUP_BYTES, backupPath, parseBackup, restoreBackup, saveBackup } from "@/lib/backup";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: Request) {
  const auth = await requireAdminApi(req);
  if (auth.error) return auth.error;

  if (Number(req.headers.get("content-length") || 0) > MAX_BACKUP_BYTES + 1024 * 1024) {
    return Response.json({ ok: false, message: "Backup file is larger than 512 MB." }, { status: 413 });
  }

  const fd = await req.formData();
  const mode = fd.get("mode") === "replace" ? "replace" : "merge";
  const includeSubscribers = fd.get("includeSubscribers") === "on";
  const includeUsers = fd.get("includeUsers") === "on";

  let raw: Buffer;
  const file = fd.get("file");
  const name = String(fd.get("name") || "");
  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_BACKUP_BYTES) return Response.json({ ok: false, message: "Backup file is larger than 512 MB." }, { status: 413 });
    raw = Buffer.from(await file.arrayBuffer());
  } else if (name) {
    const p = backupPath(name);
    if (!p) return Response.json({ ok: false, message: "Unknown backup." }, { status: 404 });
    raw = await readFile(p);
  } else {
    return Response.json({ ok: false, message: "Choose a backup file to upload." }, { status: 400 });
  }

  try {
    const backup = parseBackup(raw);
    const safety = await saveBackup("pre-restore");
    const result = await restoreBackup(backup, { mode, includeSubscribers, includeUsers });
    revalidatePath("/", "layout");
    return Response.json({ ok: true, mode, safetyBackup: safety, source: backup.siteUrl, backupCreatedAt: backup.createdAt, result });
  } catch (e) {
    return Response.json({ ok: false, message: e instanceof Error ? e.message : "Restore failed." }, { status: 400 });
  }
}
