#!/usr/bin/env node
/**
 * Preflight validator for prisma/content/*.md — runs BEFORE seeding.
 *
 * Every rule here exists because of a real failure that shipped once:
 *
 *  1. publishedAt in the future  -> page returns 404, because src/lib/posts.ts
 *     filters with `publishedAt: { lte: new Date() }`. The article is in the DB,
 *     the seed says "Seeded", the file is on disk, and the URL 404s.
 *  2. category / author typo     -> seed.mjs used findUniqueOrThrow, which throws
 *     an opaque Prisma error after some posts were already imported.
 *  3. title / description length -> SERP truncation; fixed by hand many times.
 *  4. tag that only 1-2 posts use -> /tag/<slug> is noindex, so every link to it
 *     burns crawl budget. Warn before it is introduced.
 *  5. post with no inbound link  -> orphan. Warn so a new article is never
 *     published without at least one internal link pointing at it.
 *  6. unbalanced ``` fences or a missing === faqs block -> broken rendering and
 *     no FAQPage JSON-LD.
 *  7. generated SVG with an unescaped "<" -> invalid XML, invisible diagram.
 *
 * Usage:
 *   node scripts/validate-posts.mjs                 # all files
 *   node scripts/validate-posts.mjs file-a.md ...   # selected files
 *   node scripts/validate-posts.mjs --strict        # warnings become failures
 *   node scripts/validate-posts.mjs --no-svg        # skip generated SVG check
 *
 * Exit code 1 = publish-blocking error (default) or any warning (--strict).
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONTENT_DIR = path.join(ROOT, "prisma", "content");
const SEED_FILE = path.join(ROOT, "prisma", "seed.mjs");
const MEDIA_DIR = path.join(ROOT, "public", "media");

/** Mirrors src/app/(site)/tag/[slug]/page.tsx — tags below this are noindex. */
const INDEX_MIN_POSTS = 3;

const LIMITS = {
  titleMax: 60,
  seoTitleMax: 60,
  seoDescriptionMin: 120,
  seoDescriptionMax: 160,
  excerptMin: 100,
  minFaqs: 3,
  minTakeaways: 3,
  futureSkewMs: 60_000,
};

const argv = process.argv.slice(2);
const STRICT = argv.includes("--strict");
const SKIP_SVG = argv.includes("--no-svg");
const only = argv.filter((a) => !a.startsWith("--")).map((a) => path.basename(a));

/* ------------------------------------------------------------------ helpers */

/** Read the canonical category/author slugs straight from seed.mjs so there is
 *  exactly one source of truth. */
function seedSlugs(constName) {
  const src = readFileSync(SEED_FILE, "utf8");
  const start = src.indexOf(`const ${constName} = [`);
  if (start === -1) return [];
  const end = src.indexOf("\n];", start);
  const chunk = src.slice(start, end === -1 ? src.length : end);
  return [...chunk.matchAll(/slug:\s*"([a-z0-9-]+)"/g)].map((m) => m[1]);
}

/** Same slugify as seed.mjs, so tag counts match what the UI will link to. */
function slugifyTag(name) {
  return name
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseFrontmatter(raw) {
  const text = raw.replace(/\r\n/g, "\n");
  const fm = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!fm) return null;
  const meta = {};
  for (const line of fm[1].split("\n")) {
    const i = line.indexOf(":");
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  const rest = text.slice(fm[0].length);
  const [body, ...blocks] = rest.split(/^=== /m);
  const block = (name) =>
    blocks.find((b) => b.startsWith(name))?.slice(name.length).trim() ?? "";
  return { text, meta, body: body.trim(), block };
}

const errors = [];
const warnings = [];
const fail = (file, msg) => errors.push(`${file}: ${msg}`);
const warn = (file, msg) => warnings.push(`${file}: ${msg}`);

/* ------------------------------------------------------------------- checks */

const files = readdirSync(CONTENT_DIR)
  .filter((f) => f.endsWith(".md"))
  .filter((f) => !only.length || only.includes(f))
  .sort();

if (!files.length) {
  console.error(`No markdown files matched in ${CONTENT_DIR}`);
  process.exit(1);
}

const CATEGORIES = seedSlugs("categories");
const AUTHORS = seedSlugs("authors");
const now = Date.now();

const parsed = new Map();
const tagCount = new Map(); // tag slug -> Set(files)
const outbound = new Map(); // source file -> Set(target slug)

for (const file of files) {
  const raw = readFileSync(path.join(CONTENT_DIR, file), "utf8");
  const doc = parseFrontmatter(raw);
  if (!doc) {
    fail(file, "missing --- frontmatter block");
    continue;
  }
  const { meta, body, block } = doc;
  parsed.set(file, doc);

  // --- required keys -------------------------------------------------------
  for (const key of ["title", "slug", "type", "category", "author", "tags", "publishedAt", "excerpt"]) {
    if (!meta[key]) fail(file, `frontmatter is missing "${key}"`);
  }

  // --- slug vs filename ---------------------------------------------------
  // A custom slug is legitimate (SEO-chosen URL), so this is a warning, not an
  // error. It becomes a real problem only when the publish step checks the URL:
  // a stale frontmatter slug means /blog/<slug> 404s while the file looks fine.
  const stem = path.basename(file, ".md");
  if (meta.slug && meta.slug !== stem) {
    warn(file, `slug "${meta.slug}" differs from filename "${stem}" — the live URL is /${(meta.type || "BLOG") === "NEWS" ? "news" : "blog"}/${meta.slug}`);
  }

  // --- type ---------------------------------------------------------------
  if (meta.type && !["BLOG", "NEWS"].includes(meta.type)) {
    fail(file, `type "${meta.type}" is not BLOG or NEWS (URL prefix will be wrong)`);
  }

  // --- category / author (opaque Prisma throw at seed time) ----------------
  if (meta.category && !CATEGORIES.includes(meta.category)) {
    fail(file, `unknown category "${meta.category}" — valid: ${CATEGORIES.join(", ")}`);
  }
  if (meta.author && !AUTHORS.includes(meta.author)) {
    fail(file, `unknown author "${meta.author}" — valid: ${AUTHORS.join(", ")}`);
  }

  // --- publishedAt: the #1 cause of "published but 404" -------------------
  if (meta.publishedAt) {
    const ts = Date.parse(meta.publishedAt);
    if (Number.isNaN(ts)) {
      fail(file, `publishedAt "${meta.publishedAt}" is not a parsable date`);
    } else if (ts > now + LIMITS.futureSkewMs) {
      const mins = Math.round((ts - now) / 60000);
      fail(
        file,
        `publishedAt "${meta.publishedAt}" is ${mins} min in the future; ` +
          `publishedWhere() filters publishedAt <= now, so the page will 404`
      );
    }
  }
  if (meta.modifiedAt && Number.isNaN(Date.parse(meta.modifiedAt))) {
    fail(file, `modifiedAt "${meta.modifiedAt}" is not a parsable date`);
  }

  // --- SEO lengths --------------------------------------------------------
  if (meta.seoTitle && meta.seoTitle.length > LIMITS.seoTitleMax) {
    warn(file, `seoTitle is ${meta.seoTitle.length} chars (max ${LIMITS.seoTitleMax}) — SERP truncation`);
  }
  if (meta.title && meta.title.length > LIMITS.titleMax) {
    warn(file, `title is ${meta.title.length} chars (max ${LIMITS.titleMax}) — SERP truncation`);
  }
  if (meta.seoDescription) {
    const n = meta.seoDescription.length;
    if (n < LIMITS.seoDescriptionMin || n > LIMITS.seoDescriptionMax) {
      warn(file, `seoDescription is ${n} chars (want ${LIMITS.seoDescriptionMin}-${LIMITS.seoDescriptionMax})`);
    }
  } else {
    warn(file, "no seoDescription — meta description falls back to excerpt");
  }
  if (meta.excerpt && meta.excerpt.length < LIMITS.excerptMin) {
    warn(file, `excerpt is ${meta.excerpt.length} chars (min ${LIMITS.excerptMin})`);
  }

  // --- body structure -----------------------------------------------------
  if ((body.match(/^```/gm) || []).length % 2 !== 0) {
    fail(file, "unbalanced ``` code fence — rendering will swallow the rest of the page");
  }
  if (!/^\|.*\|\n^\|[\s:|-]+\|/m.test(body)) {
    warn(file, "no markdown table — weaker for AI Overviews / featured snippets");
  }

  const takeaways = block("takeaways");
  const takeawayLines = takeaways.split("\n").filter((l) => /^[-*]\s+/.test(l.trim()));
  if (takeawayLines.length < LIMITS.minTakeaways) {
    warn(file, `only ${takeawayLines.length} takeaways (min ${LIMITS.minTakeaways})`);
  }

  const faqBlock = block("faqs");
  const faqs = faqBlock.split(/\n(?=Q:)/).filter((c) => /^Q:\s*[\s\S]+?\nA:\s*[\s\S]+$/.test(c.trim()));
  if (faqs.length < LIMITS.minFaqs) {
    fail(file, `only ${faqs.length} parseable FAQ entries (min ${LIMITS.minFaqs}) — no FAQPage JSON-LD`);
  }

  const sources = block("sources").split("\n").filter(Boolean);
  if (!sources.length) warn(file, "no === sources block");

  // --- tag inventory (weak tags are noindex) ------------------------------
  for (const name of (meta.tags || "").split(",").map((t) => t.trim()).filter(Boolean)) {
    const slug = slugifyTag(name);
    if (!tagCount.has(slug)) tagCount.set(slug, new Set());
    tagCount.get(slug).add(file);
  }
}

/* ------------------------------------------------- internal links / orphans */

for (const [file, doc] of parsed) {
  const targets = new Set();
  for (const m of doc.body.matchAll(/\/(blog|news)\/([a-z0-9-]+)/g)) {
    if (m[2] !== path.basename(file, ".md")) targets.add(m[2]);
  }
  for (const m of doc.block("sources").matchAll(/\/(blog|news)\/([a-z0-9-]+)/g)) {
    if (m[2] !== path.basename(file, ".md")) targets.add(m[2]);
  }
  outbound.set(file, targets);
}

const inbound = new Map([...parsed.keys()].map((f) => [path.basename(f, ".md"), 0]));
for (const targets of outbound.values()) {
  for (const t of targets) if (inbound.has(t)) inbound.set(t, inbound.get(t) + 1);
}

// Only report orphans for the files being validated, so a single-file publish
// does not warn about every untouched article.
for (const file of files) {
  const slug = path.basename(file, ".md");
  if (inbound.get(slug) === 0 && parsed.size > 1) {
    warn(file, `0 inbound internal links — orphan page; add a link from a related article`);
  }
}

/* ---------------------------------------------- weak tags (noindex burn) */

for (const [tag, posts] of [...tagCount].sort((a, b) => a[1].size - b[1].size)) {
  if (only.length) {
    // Only complain about tags that these very files introduce.
    const touched = files.some((f) => posts.has(f));
    if (!touched) continue;
  }
  if (posts.size < INDEX_MIN_POSTS) {
    warn(
      `tag:${tag}`,
      `used by ${posts.size} post(s) — /tag/${tag} will be noindex; ` +
        `reuse an existing tag or add ${INDEX_MIN_POSTS - posts.size} more article(s)`
    );
  }
}

/* ------------------------------------------------- generated SVG XML check */

if (!SKIP_SVG && !only.length && existsSync(MEDIA_DIR)) {
  let xmllint = null;
  try {
    execFileSync("xmllint", ["--version"], { stdio: "pipe" });
    xmllint = "xmllint";
  } catch {
    xmllint = null;
  }
  if (!xmllint) {
    warnings.push("svg: xmllint not installed — unescaped < in diagrams cannot be checked");
  } else {
    const svgs = [];
    const walk = (dir) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(p);
        else if (entry.name.endsWith(".svg")) svgs.push(p);
      }
    };
    walk(MEDIA_DIR);
    for (const p of svgs) {
      try {
        execFileSync(xmllint, ["--noout", p], { stdio: "pipe" });
      } catch (e) {
        const detail = String(e.stderr || "").split("\n").find((l) => l.includes("error")) || "invalid XML";
        fail(path.relative(ROOT, p), `invalid SVG XML (unescaped "<" or "&"?) — ${detail.trim()}`);
      }
    }
    if (svgs.length) warnings.push(`svg: checked ${svgs.length} generated SVG file(s) with xmllint`);
  }
}

/* ------------------------------------------------------------------ report */

const weakTags = [...tagCount].filter(([, p]) => p.size < INDEX_MIN_POSTS).length;
console.log(`Checked ${parsed.size} article(s) in prisma/content`);
console.log(`Tags: ${tagCount.size} total, ${weakTags} below the ${INDEX_MIN_POSTS}-post index threshold`);

if (warnings.length) {
  console.log(`\n${warnings.length} warning(s):`);
  for (const w of warnings) console.log(`  ! ${w}`);
}
if (errors.length) {
  console.log(`\n${errors.length} error(s) — publishing would break:`);
  for (const e of errors) console.log(`  x ${e}`);
}

const failed = errors.length > 0 || (STRICT && warnings.length > 0);
if (failed) {
  console.log(`\nFAILED${STRICT && !errors.length ? " (strict: warnings are failures)" : ""}`);
  process.exit(1);
}
console.log("\nOK — safe to publish");
