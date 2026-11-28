// Generates editorial covers (1200x675 JPEG) + bespoke technical diagrams (1200x640 PNG, supporting Figure 1 & optional Figure 2),
// registers all assets in Prisma Media, updates Post records in SQLite, and syncs prisma/content/*.md.
//
// Modes:
//   --render-and-db           Run inside induqora-app-1 (with FONTCONFIG_FILE set) to render images & update DB
//   --sync-markdown           Run on host to sync coverImage/coverAlt/coverCaption + inline diagrams into prisma/content/*.md
//   --only=slug1,slug2,...    Optional filter to process only specific article slugs

import fs from "node:fs";
import path from "node:path";
import { ARTICLE_VISUALS } from "./visual-specs.mjs";
import { ARTICLE_VISUALS_BATCH2 } from "./visual-specs-batch2.mjs";
import { ARTICLE_VISUALS_BATCH3 } from "./visual-specs-batch3.mjs";
import { ARTICLE_VISUALS_BATCH4 } from "./visual-specs-batch4.mjs";
import { ARTICLE_VISUALS_BATCH5 } from "./visual-specs-batch5.mjs";
import { ARTICLE_VISUALS_BATCH6 } from "./visual-specs-batch6.mjs";
import { ARTICLE_VISUALS_BATCH7 } from "./visual-specs-batch7.mjs";
import { ARTICLE_VISUALS_BATCH8 } from "./visual-specs-batch8.mjs";
import { ARTICLE_VISUALS_BATCH9 } from "./visual-specs-batch9.mjs";
import { renderCoverSvg } from "./render-covers.mjs";
import { renderDiagramSvg } from "./render-diagrams.mjs";

const ALL_VISUALS = [...ARTICLE_VISUALS, ...ARTICLE_VISUALS_BATCH2, ...ARTICLE_VISUALS_BATCH3, ...ARTICLE_VISUALS_BATCH4, ...ARTICLE_VISUALS_BATCH5, ...ARTICLE_VISUALS_BATCH6, ...ARTICLE_VISUALS_BATCH7, ...ARTICLE_VISUALS_BATCH8, ...ARTICLE_VISUALS_BATCH9];
const MEDIA_SUBDIR = "2026/11";

function mediaUrl(filename) {
  return `/media/${MEDIA_SUBDIR}/${filename}`;
}

function buildInlineMarkdown(filename, diag) {
  const alt = diag.alt.replace(/[\[\]]/g, "");
  const cap = diag.caption.replace(/"/g, "'");
  return `![${alt}](${mediaUrl(filename)} "${cap}")`;
}

function injectInlineDiagram(body, slug, filename, diag) {
  const url = mediaUrl(filename);
  const mdImg = buildInlineMarkdown(filename, diag);
  const lines = body.replace(/\r\n/g, "\n").split("\n");

  // Idempotent update if diagram URL already exists in body
  const existingIdx = lines.findIndex((l) => l.includes(url));
  if (existingIdx !== -1) {
    lines[existingIdx] = mdImg;
    return lines.join("\n");
  }

  const target = `## ${diag.insertAfterH2}`.trim().toLowerCase();
  const hIdx = lines.findIndex((l) => l.trim().toLowerCase() === target);
  if (hIdx === -1) {
    throw new Error(`Heading not found for ${slug}: "${diag.insertAfterH2}"`);
  }

  // Advance past blank lines after H2, then past the first content block (paragraph, table, or list)
  let i = hIdx + 1;
  while (i < lines.length && lines[i].trim() === "") i++;
  if (i < lines.length && lines[i].trim().startsWith("###")) {
    lines.splice(i, 0, mdImg, "");
    return lines.join("\n");
  }
  while (i < lines.length && lines[i].trim() !== "") i++;
  lines.splice(i, 0, "", mdImg);
  return lines.join("\n").replace(/\n{3,}/g, "\n\n");
}

function getTargetVisuals() {
  const onlyArg = process.argv.find((a) => a.startsWith("--only="));
  if (!onlyArg) return ALL_VISUALS;
  const slugs = new Set(
    onlyArg
      .slice("--only=".length)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  );
  const matched = ALL_VISUALS.filter((a) => slugs.has(a.slug));
  if (!matched.length) throw new Error(`No matching slugs for ${onlyArg}`);
  return matched;
}

function syncMarkdownFiles(contentDir) {
  let updated = 0;
  for (const article of getTargetVisuals()) {
    const filePath = path.join(contentDir, article.file);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Missing markdown file: ${filePath}`);
    }
    const raw = fs.readFileSync(filePath, "utf8").replace(/\r\n/g, "\n");
    const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n/);
    if (!fmMatch) throw new Error(`Missing frontmatter in ${article.file}`);

    const coverUrl = mediaUrl(`cover-${article.slug}.jpg`);
    const fmLines = fmMatch[1]
      .split("\n")
      .filter((l) => !/^(coverImage|coverAlt|coverCaption):/.test(l.trim()));
    fmLines.push(`coverImage: ${coverUrl}`);
    fmLines.push(`coverAlt: ${article.cover.alt}`);
    fmLines.push(`coverCaption: ${article.cover.caption}`);

    const rest = raw.slice(fmMatch[0].length);
    const sepIdx = rest.search(/^=== /m);
    const body = sepIdx === -1 ? rest : rest.slice(0, sepIdx);
    const tail = sepIdx === -1 ? "" : rest.slice(sepIdx);

    let newBody = injectInlineDiagram(body.trimEnd(), article.slug, `diagram-${article.slug}.png`, article.diagram);
    if (article.diagram2) {
      newBody = injectInlineDiagram(newBody, article.slug, `diagram2-${article.slug}.png`, article.diagram2);
    }
    const newFull = `---\n${fmLines.join("\n")}\n---\n${newBody}\n\n${tail}`.replace(/\n{3,}=== /g, "\n\n=== ");
    fs.writeFileSync(filePath, newFull, "utf8");
    updated++;
  }
  console.log(`Synced ${updated} markdown files in ${contentDir}`);
}

async function renderDiagramPng(sharp, outDir, filename, article, diagSpec) {
  const diagPath = path.join(outDir, filename);
  const diagSvg = renderDiagramSvg(article, diagSpec);
  const diagBuf = await sharp(Buffer.from(diagSvg, "utf8"), { density: 96 })
    .resize(1200, 640, { fit: "fill" })
    .png({ compressionLevel: 9, palette: true, quality: 92, effort: 8 })
    .toBuffer();
  const dMeta = await sharp(diagBuf).metadata();
  if (dMeta.width !== 1200 || dMeta.height !== 640 || diagBuf.length < 10000) {
    throw new Error(`Invalid diagram image ${filename}: ${dMeta.width}x${dMeta.height}, ${diagBuf.length}B`);
  }
  fs.writeFileSync(diagPath, diagBuf);
  return diagBuf;
}

async function renderAndUpdateDb() {
  const { default: sharp } = await import("sharp");
  const { PrismaClient } = await import("@prisma/client");
  const db = new PrismaClient();

  const uploadRoot = process.env.UPLOAD_DIR || "/app/data/uploads";
  const outDir = path.join(uploadRoot, MEDIA_SUBDIR);
  fs.mkdirSync(outDir, { recursive: true });

  const targets = getTargetVisuals();
  let rendered = 0;
  let totalBytes = 0;

  try {
    for (const article of targets) {
      // 1. Render 1200x675 editorial cover (progressive JPEG q=88)
      const coverName = `cover-${article.slug}.jpg`;
      const coverPath = path.join(outDir, coverName);
      const coverSvg = renderCoverSvg(article);
      const coverBuf = await sharp(Buffer.from(coverSvg, "utf8"), { density: 96 })
        .resize(1200, 675, { fit: "fill" })
        .jpeg({ quality: 88, progressive: true, chromaSubsampling: "4:4:4" })
        .toBuffer();
      const cMeta = await sharp(coverBuf).metadata();
      if (cMeta.width !== 1200 || cMeta.height !== 675 || coverBuf.length < 15000) {
        throw new Error(`Invalid cover image for ${article.slug}: ${cMeta.width}x${cMeta.height}, ${coverBuf.length}B`);
      }
      fs.writeFileSync(coverPath, coverBuf);
      totalBytes += coverBuf.length;
      rendered++;

      // 2. Render Figure 1 (1200x640 PNG)
      const diagName = `diagram-${article.slug}.png`;
      const diagBuf = await renderDiagramPng(sharp, outDir, diagName, article, article.diagram);
      totalBytes += diagBuf.length;
      rendered++;

      // 3. Register Cover & Diagram 1 in Media
      const coverUrl = mediaUrl(coverName);
      const diagUrl = mediaUrl(diagName);
      await db.media.upsert({
        where: { url: coverUrl },
        update: { filename: coverName, mime: "image/jpeg", size: coverBuf.length, alt: article.cover.alt },
        create: { filename: coverName, url: coverUrl, mime: "image/jpeg", size: coverBuf.length, alt: article.cover.alt },
      });
      await db.media.upsert({
        where: { url: diagUrl },
        update: { filename: diagName, mime: "image/png", size: diagBuf.length, alt: article.diagram.alt },
        create: { filename: diagName, url: diagUrl, mime: "image/png", size: diagBuf.length, alt: article.diagram.alt },
      });

      // 4. Optional Figure 2 (1200x640 PNG)
      let diag2Name = null;
      if (article.diagram2) {
        diag2Name = `diagram2-${article.slug}.png`;
        const diag2Buf = await renderDiagramPng(sharp, outDir, diag2Name, article, article.diagram2);
        totalBytes += diag2Buf.length;
        rendered++;
        const diag2Url = mediaUrl(diag2Name);
        await db.media.upsert({
          where: { url: diag2Url },
          update: { filename: diag2Name, mime: "image/png", size: diag2Buf.length, alt: article.diagram2.alt },
          create: { filename: diag2Name, url: diag2Url, mime: "image/png", size: diag2Buf.length, alt: article.diagram2.alt },
        });
      }

      // 5. Update Post row in SQLite
      const post = await db.post.findUnique({ where: { slug: article.slug } });
      if (!post) throw new Error(`Post not found in DB: ${article.slug}`);
      let updatedContent = injectInlineDiagram(post.content, article.slug, diagName, article.diagram);
      if (article.diagram2 && diag2Name) {
        updatedContent = injectInlineDiagram(updatedContent, article.slug, diag2Name, article.diagram2);
      }
      await db.post.update({
        where: { id: post.id },
        data: {
          coverImage: coverUrl,
          coverAlt: article.cover.alt,
          coverCaption: article.cover.caption,
          content: updatedContent,
        },
      });
    }

    console.log(`Rendered ${rendered} images (${(totalBytes / 1024 / 1024).toFixed(2)} MB total) and updated ${targets.length} posts in DB.`);
  } finally {
    await db.$disconnect();
  }
}

const args = new Set(process.argv.slice(2));
if (args.has("--render-and-db")) {
  await renderAndUpdateDb();
} else if (args.has("--sync-markdown")) {
  const dirArg = process.argv.find((a) => a.startsWith("--content-dir="));
  const contentDir = dirArg ? dirArg.slice("--content-dir=".length) : "/root/induqora/prisma/content";
  syncMarkdownFiles(contentDir);
} else {
  console.error("Specify --render-and-db or --sync-markdown");
  process.exit(1);
}
