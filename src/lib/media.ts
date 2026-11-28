import { readFileSync } from "node:fs";
import { resolveUpload } from "./uploads";

export type Dimensions = { width: number; height: number };

const cache = new Map<string, Dimensions | null>();

/**
 * Reads intrinsic dimensions straight from the image header so markdown images can carry
 * width/height attributes. Without them the browser reserves no space and body images cause CLS.
 * Falls back to null (no attributes) for formats we cannot parse, e.g. AVIF.
 */
function parseSize(buf: Buffer): Dimensions | null {
  if (buf.length < 24) return null;

  // PNG
  if (buf[0] === 0x89 && buf.toString("ascii", 1, 4) === "PNG") {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }

  // GIF
  if (buf.toString("ascii", 0, 3) === "GIF") {
    return { width: buf.readUInt16LE(6), height: buf.readUInt16LE(8) };
  }

  // JPEG: walk segments until a SOFn marker
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i + 9 < buf.length) {
      if (buf[i] !== 0xff) {
        i += 1;
        continue;
      }
      const marker = buf[i + 1];
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return { width: buf.readUInt16BE(i + 7), height: buf.readUInt16BE(i + 5) };
      }
      i += 2 + buf.readUInt16BE(i + 2);
    }
    return null;
  }

  // WebP
  if (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") {
    const chunk = buf.toString("ascii", 12, 16);
    if (chunk === "VP8X") return { width: buf.readUIntLE(24, 3) + 1, height: buf.readUIntLE(27, 3) + 1 };
    if (chunk === "VP8 ") return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
    if (chunk === "VP8L") {
      const bits = buf.readUInt32LE(21);
      return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
    }
  }

  return null;
}

/** Intrinsic size of a locally uploaded /media/... image, or null when unknown. */
export function mediaDimensions(src: string): Dimensions | null {
  if (!src.startsWith("/media/")) return null;
  const cached = cache.get(src);
  if (cached !== undefined) return cached;

  let dims: Dimensions | null = null;
  try {
    const segments = decodeURIComponent(src.slice("/media/".length)).split("/").filter(Boolean);
    const file = resolveUpload(segments);
    if (file) dims = parseSize(readFileSync(file));
  } catch {
    dims = null;
  }
  cache.set(src, dims);
  return dims;
}
