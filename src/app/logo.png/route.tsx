import { brandSquare } from "@/lib/brand-image";

export const dynamic = "force-static";

export function GET() {
  return brandSquare(512);
}
