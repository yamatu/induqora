import { readFile } from "node:fs/promises";
import path from "node:path";
import { EXT_MIME, resolveUpload } from "@/lib/uploads";

export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const segments = (await params).path;
  const file = resolveUpload(segments);
  const mime = file ? EXT_MIME[path.extname(file).toLowerCase()] : undefined;
  if (!file || !mime) return new Response("Not found", { status: 404 });

  try {
    const data = await readFile(file);
    return new Response(data, {
      headers: {
        "Content-Type": mime,
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
