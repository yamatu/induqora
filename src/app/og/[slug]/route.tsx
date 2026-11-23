import { ImageResponse } from "next/og";
import { db } from "@/lib/db";
import { publishedWhere } from "@/lib/posts";
import { siteConfig } from "@/lib/site";
import { formatDate } from "@/lib/utils";

export const revalidate = 86400;

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await db.post.findFirst({
    where: publishedWhere({ slug }),
    select: { title: true, type: true, publishedAt: true, category: { select: { name: true } }, author: { select: { name: true } } },
  });

  const title = post?.title ?? siteConfig.tagline;
  const label = post ? `${post.type === "NEWS" ? "NEWS" : "INSIGHTS"} · ${post.category.name.toUpperCase()}` : siteConfig.domain.toUpperCase();
  const byline = post ? `${post.author.name} · ${formatDate(post.publishedAt)}` : siteConfig.description.slice(0, 120);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background: "linear-gradient(135deg, #0f172a 0%, #0f2a4a 60%, #0b5cad 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 18, height: 56, background: "#f59e0b", borderRadius: 4 }} />
          <div style={{ fontSize: 40, fontWeight: 700, letterSpacing: -1 }}>Induqora</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 24, color: "#fbbf24", letterSpacing: 2 }}>{label}</div>
          <div style={{ fontSize: title.length > 80 ? 48 : 60, fontWeight: 700, lineHeight: 1.15, maxWidth: 1050 }}>{title}</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24, color: "#cbd5e1" }}>
          <div>{byline}</div>
          <div>{siteConfig.domain}</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
