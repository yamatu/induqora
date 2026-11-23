import path from "node:path";

export const UPLOAD_ROOT = path.resolve(process.env.UPLOAD_DIR || "./uploads");

export const ALLOWED_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/avif": ".avif",
};

export const EXT_MIME: Record<string, string> = Object.fromEntries(Object.entries(ALLOWED_MIME).map(([m, e]) => [e, m]));
EXT_MIME[".jpeg"] = "image/jpeg";

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

export function resolveUpload(segments: string[]) {
  const target = path.resolve(UPLOAD_ROOT, ...segments);
  if (!target.startsWith(UPLOAD_ROOT + path.sep)) return null;
  return target;
}
