#!/usr/bin/env node
/**
 * Consistency check for the article image pipeline.
 *
 * Adding a new batch of covers/diagrams touches three places, and forgetting one
 * used to fail late (inside Docker, after seeding):
 *
 *   1. scripts/render-diagrams-<x>.mjs   must be imported AND chained in
 *                                        renderDiagramSvg()'s dispatcher in render-diagrams.mjs
 *   2. scripts/visual-specs-batch<n>.mjs must be imported AND spread into ALL_VISUALS
 *   3. every spec needs a matching prisma/content/*.md whose slug equals the spec slug
 *
 * It also renders every diagram body once, so a typo in `diagram.type`
 * ("Unknown diagram type") is caught here instead of during publishing, and
 * every generated SVG string is verified as parseable XML — an unescaped "<"
 * in a label produces a diagram that silently does not display.
 *
 * Usage:
 *   node scripts/check-visuals.mjs
 *   node scripts/check-visuals.mjs --svg     # also validate rendered SVGs under public/media as XML
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPTS = path.join(ROOT, "scripts");
const CONTENT = path.join(ROOT, "prisma", "content");

const errors = [];
const warnings = [];

/* 1. diagram modules imported and chained -------------------------------- */

const dispatcherSrc = readFileSync(path.join(SCRIPTS, "render-diagrams.mjs"), "utf8");
const renderModules = readdirSync(SCRIPTS)
  .filter((f) => /^render-diagrams-[a-z]\.mjs$/.test(f))
  .sort();

for (const file of renderModules) {
  const letter = file.match(/^render-diagrams-([a-z])\.mjs$/)[1].toUpperCase();
  const symbol = `renderDiagramBody${letter}`;
  if (!dispatcherSrc.includes(`from "./${file}"`)) {
    errors.push(`scripts/render-diagrams.mjs does not import ${file}`);
  }
  if (!dispatcherSrc.includes(`${symbol}(`)) {
    errors.push(`scripts/render-diagrams.mjs never calls ${symbol}() — diagrams of that batch will throw "Unknown diagram type"`);
  }
}
if (!renderModules.length) warnings.push("no render-diagrams-*.mjs modules found");

/* 2. visual spec batches imported and merged ----------------------------- */

const imageSrc = readFileSync(path.join(SCRIPTS, "generate-article-images.mjs"), "utf8");
const specModules = readdirSync(SCRIPTS)
  .filter((f) => /^visual-specs(-batch\d+)?\.mjs$/.test(f))
  .sort();

for (const file of specModules) {
  const exportMatch = readFileSync(path.join(SCRIPTS, file), "utf8").match(/^export const (\w+)/m);
  if (!exportMatch) {
    errors.push(`${file} has no "export const ARTICLE_VISUALS..." declaration`);
    continue;
  }
  const symbol = exportMatch[1];
  if (!imageSrc.includes(`from "./${file}"`)) {
    errors.push(`scripts/generate-article-images.mjs does not import ${file}`);
  }
  if (!imageSrc.includes(`...${symbol}`)) {
    errors.push(`scripts/generate-article-images.mjs never spreads ${symbol} into ALL_VISUALS — those articles get no images`);
  }
}

/* 3. specs point at real markdown with a matching slug ------------------- */

// Import ONLY the spec modules: generate-article-images.mjs performs work at
// import time (and calls process.exit without a mode flag), so it must not be
// evaluated here. Its import lines and ALL_VISUALS spreads are checked above.
const specs = [];
for (const file of specModules) {
  const mod = await import(path.join(SCRIPTS, file));
  const key = Object.keys(mod).find((k) => k.startsWith("ARTICLE_VISUALS"));
  if (!key) {
    errors.push(`${file}: no ARTICLE_VISUALS* export`);
    continue;
  }
  if (!Array.isArray(mod[key])) {
    errors.push(`${file}: ${key} is not an array`);
    continue;
  }
  specs.push(...mod[key]);
}

const { renderDiagramSvg } = await import(path.join(SCRIPTS, "render-diagrams.mjs"));

const seenFile = new Map();
for (const spec of specs) {
  const label = spec.file || spec.slug || "(spec with no file/slug)";
  if (!spec.file) {
    errors.push(`${label}: spec has no "file" field`);
    continue;
  }
  if (seenFile.has(spec.file)) {
    errors.push(`${label}: duplicate spec (also defined earlier) — the later one silently wins`);
  }
  seenFile.set(spec.file, true);

  if (!existsSync(path.join(CONTENT, spec.file))) {
    errors.push(`${label}: prisma/content/${spec.file} does not exist`);
  }
  // Custom slugs are allowed (the file stem is just the source name). What
  // matters is that the spec slug matches the frontmatter slug actually seeded,
  // otherwise the renderer updates a Post row that does not exist.
  const mdPath = path.join(CONTENT, spec.file);
  if (spec.slug && existsSync(mdPath)) {
    const fmSlug = readFileSync(mdPath, "utf8").match(/^slug:\s*(.+)$/m)?.[1]?.trim();
    if (fmSlug && fmSlug !== spec.slug) {
      errors.push(`${label}: spec slug "${spec.slug}" != frontmatter slug "${fmSlug}" — images will attach to the wrong row`);
    }
  }

  if (!spec.diagram) {
    warnings.push(`${label}: no diagram block (cover only)`);
    continue;
  }
  try {
    const svg = renderDiagramSvg(spec);
    if (!svg || typeof svg !== "string") {
      errors.push(`${label}: renderDiagramSvg returned ${typeof svg}`);
      continue;
    }
    // A ">" in text content is legal XML; only a "<" that does not start a tag
    // breaks the document. This is the failure that made a diagram invisible.
    const stray = svg.match(/<(?![A-Za-z/!?])/);
    if (stray) {
      const at = svg.indexOf(stray[0]);
      errors.push(
        `${label}: unescaped "<" in SVG text near ...${svg.slice(Math.max(0, at - 40), at + 20).replace(/\s+/g, " ")}...`
      );
    }
    if (/&(?!(amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)/.test(svg.replace(/&(amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);/g, ""))) {
      errors.push(`${label}: bare "&" in SVG — invalid XML entity`);
    }
  } catch (e) {
    errors.push(`${label}: ${String(e.message).split("\n")[0]}`);
  }
}

/* 4. optional: validate already rendered SVG files ----------------------- */

if (process.argv.includes("--svg")) {
  let xmllint = true;
  try {
    const { execFileSync } = await import("node:child_process");
    execFileSync("xmllint", ["--version"], { stdio: "pipe" });
  } catch {
    xmllint = false;
  }
  if (!xmllint) {
    warnings.push("xmllint not installed — skipped validation of rendered SVG files");
  } else {
    const { execFileSync } = await import("node:child_process");
    const mediaDir = path.join(ROOT, "public", "media");
    const svgs = [];
    const walk = (dir) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(p);
        else if (entry.name.endsWith(".svg")) svgs.push(p);
      }
    };
    if (existsSync(mediaDir)) walk(mediaDir);
    for (const p of svgs) {
      try {
        execFileSync("xmllint", ["--noout", p], { stdio: "pipe" });
      } catch {
        errors.push(`${path.relative(ROOT, p)}: invalid XML`);
      }
    }
    if (svgs.length) warnings.push(`validated ${svgs.length} rendered SVG file(s)`);
  }
}

/* report ----------------------------------------------------------------- */

console.log(`Diagram modules: ${renderModules.length}, visual spec batches: ${specModules.length}, specs checked: ${specs.length}`);

if (warnings.length) {
  console.log(`\n${warnings.length} note(s):`);
  for (const w of warnings) console.log(`  ! ${w}`);
}
if (errors.length) {
  console.log(`\n${errors.length} error(s):`);
  for (const e of errors) console.log(`  x ${e}`);
  console.log("\nFAILED");
  process.exit(1);
}
console.log("\nOK — image pipeline registrations are consistent");
