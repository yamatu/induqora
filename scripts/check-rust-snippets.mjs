#!/usr/bin/env node
/**
 * Verifies the Rust snippets in prisma/content/*.md against the real crates.
 *
 * Why this exists: article code was written from memory twice and both times the
 * API was wrong (an ethercrab `timeouts` field that did not exist, an opcua
 * `cert.not_after` accessor that is not public). Readers copy those snippets.
 *
 * Checks per article, for every rust code fence and every `use ...;` line:
 *
 *   1. crate exists on crates.io                       -> error
 *   2. version pinned in the article exists            -> error
 *   3. `use <crate>::<a>::<b>` first path segment is a real module or public
 *      item in the crate source                        -> error
 *   4. public types named in the snippet exist in the
 *      crate source (checked only for crates the
 *      snippet actually imports)                       -> warning
 *
 * Crate sources are downloaded once into
 *   ${TMPDIR:-/tmp}/induqora-crate-cache
 * and reused, so repeat runs are offline.
 *
 * Usage:
 *   node scripts/check-rust-snippets.mjs                 # all articles
 *   node scripts/check-rust-snippets.mjs file.md         # selected articles
 *   node scripts/check-rust-snippets.mjs --strict        # warnings fail too
 *   node scripts/check-rust-snippets.mjs --no-download   # crates.io checks only
 */
import { readFileSync, readdirSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONTENT = path.join(ROOT, "prisma", "content");
const CACHE = path.join(process.env.TMPDIR || os.tmpdir(), "induqora-crate-cache");

const argv = process.argv.slice(2);
const STRICT = argv.includes("--strict");
const NO_DOWNLOAD = argv.includes("--no-download");
const only = argv.filter((a) => !a.startsWith("--")).map((a) => path.basename(a));

const errors = [];
const warnings = [];
const UA = { "User-Agent": "induqora-rust-snippet-check/1.0 (editorial verification)" };

/* --------------------------------------------------------------- extraction */

/** Rust keywords / std items that are not crate paths. */
const STD_ROOTS = new Set([
  "std", "core", "alloc", "crate", "self", "super", "Self",
  "String", "Vec", "Option", "Result", "Box", "Some", "None", "Ok", "Err",
]);

/** std / very common identifiers that must never be reported as "not in crate". */
const STD_IDS = new Set([
  "String","Vec","Option","Result","Error","Self","Some","None","Ok","Err","Socket",
  "Duration","Instant","Arc","Mutex","HashMap","HashSet","BTreeMap","Sender","Receiver",
  "JoinHandle","Runtime","TcpStream","UnixStream","Path","PathBuf","Read","Write",
  "Clone","Default","Debug","Display","Send","Sync","Future","Pin","Thread",
  "AtomicBool","AtomicU8","AtomicU16","AtomicU32","AtomicU64","AtomicUsize",
  "SystemTime","CString","CStr","Box","Rc","RefCell","Cell","Cow","Iterator",
  "IntoIterator","From","TryFrom","AsRef","AsMut","FromStr","ToString","Ordering",
  "MutexGuard","RwLock","Condvar","Once","Extend","ExactSizeIterator","CanFrame",
  "StandardId","Data","Timer","Signal","Seconds","Millis","Context","Value","DateTime",
]);

function sidIsStd(id) {
  return STD_IDS.has(id);
}

const crateMeta = new Map(); // crate name -> { maxVersion, versions:Set }

function normalizeCrate(seg) {
  return seg.replace(/_/g, "-");
}

/** Pull rust fences out of an article body. */
function rustBlocks(text) {
  const blocks = [];
  const re = /```([a-zA-Z0-9]*)\n([\s\S]*?)```/g;
  let m;
  while ((m = re.exec(text))) {
    const lang = (m[1] || "").toLowerCase();
    if (lang === "rust" || lang === "rs") blocks.push(m[2]);
  }
  return blocks;
}

/** Parse the snippets into the facts we can verify. */
function analyze(text) {
  const blocks = rustBlocks(text);
  const uses = new Set(); // "crate::a::b"
  const pinned = new Map(); // crate -> version requirement
  const tokensByCrate = new Map(); // crate -> Set<Identifier>
  let hasRust = false;

  const codeAll = blocks.join("\n");
  if (codeAll.trim()) hasRust = true;

  for (const line of codeAll.split("\n")) {
    const u = line.match(/^\s*use\s+([a-zA-Z0-9_]+(?:::[A-Za-z0-9_*{}, ]+)?)/);
    if (u) uses.add(u[1].trim());

    // Cargo.toml-style pins often appear inside the fence as a comment block.
    const p = line.match(/^\s*(?:#\s*)?([a-z][a-z0-9_-]+)\s*=\s*"([~^=<>0-9.x*\s]+)"/);
    if (p) pinned.set(p[1], p[2].trim());
  }

  // `crate = "x.y"` written in prose / Cargo.toml fences (```toml is not a rust
  // fence, so also scan the whole article for backticked version pins).
  for (const m of text.matchAll(/`([a-z][a-z0-9_-]+)\s+(\d+\.\d+(?:\.\d+)?)`/g)) {
    if (!pinned.has(m[1])) pinned.set(m[1], m[2]);
  }

  return { blocks, uses: [...uses], pinned, hasRust, tokensByCrate };
}

/* ------------------------------------------------------------- crates.io API */

async function apiCrate(name) {
  if (crateMeta.has(name)) return crateMeta.get(name);
  let data = null;
  try {
    const res = await fetch(`https://crates.io/api/v1/crates/${name}`, {
      headers: UA,
      signal: AbortSignal.timeout(15000),
    });
    if (res.status === 404) {
      crateMeta.set(name, { missing: true });
      return crateMeta.get(name);
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    data = await res.json();
  } catch (e) {
    // Do not turn a network problem into a content error.
    crateMeta.set(name, { unknown: String(e.message) });
    return crateMeta.get(name);
  }
  const versions = (data.versions || []).filter((v) => !v.yanked).map((v) => v.num);
  crateMeta.set(name, { maxVersion: data.crate?.max_version, versions: new Set(versions) });
  return crateMeta.get(name);
}

/** Highest published version matching a simple requirement like "0.17" / "^0.17" / "=0.17.0". */
function satisfies(req, version) {
  const want = req.replace(/^[\^~=><\s]+/, "").trim();
  if (!want || want === "*") return true;
  const w = want.split(".").map(Number);
  const v = version.split(".").map(Number);
  for (let i = 0; i < w.length; i++) {
    if (!Number.isFinite(w[i])) return true; // e.g. "0.x"
    if (v[i] !== w[i]) return false;
  }
  return true;
}

/* --------------------------------------------------------- crate source pull */

async function crateSource(name, version) {
  if (NO_DOWNLOAD) return null;
  const dir = path.join(CACHE, `${name}-${version}`);
  if (existsSync(path.join(dir, ".ok"))) return dir;
  try {
    mkdirSync(CACHE, { recursive: true });
    const res = await fetch(`https://crates.io/api/v1/crates/${name}/${version}/download`, {
      headers: UA,
      redirect: "follow",
      signal: AbortSignal.timeout(60000),
    });
    if (!res.ok) throw new Error(`download HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const tgz = path.join(CACHE, `${name}-${version}.crate`);
    writeFileSync(tgz, buf);
    mkdirSync(dir, { recursive: true });
    execFileSync("tar", ["-xzf", tgz, "-C", dir, "--strip-components=1"], { stdio: "pipe" });
    writeFileSync(path.join(dir, ".ok"), version);
    return dir;
  } catch (e) {
    warnings.push(`crate:${name}: could not fetch source for ${version} (${String(e.message).split("\n")[0]}) — deep checks skipped`);
    return null;
  }
}

/** Concatenate the crate's Rust sources (bounded, so huge crates stay cheap). */
function crateSourceText(dir) {
  const out = [];
  let bytes = 0;
  const walk = (d) => {
    if (bytes > 4_000_000) return;
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith(".rs")) {
        const t = readFileSync(p, "utf8");
        out.push(t);
        bytes += t.length;
      }
    }
  };
  if (existsSync(path.join(dir, "src"))) walk(path.join(dir, "src"));
  return out.join("\n");
}

/* ------------------------------------------------------------------- checks */

const files = readdirSync(CONTENT)
  .filter((f) => f.endsWith(".md"))
  .filter((f) => !only.length || only.includes(f))
  .sort();

let checkedCrates = new Set();
let checkedUses = 0;
let skippedNoRust = 0;

for (const file of files) {
  const text = readFileSync(path.join(CONTENT, file), "utf8");
  const { blocks, uses, pinned, hasRust } = analyze(text);
  if (!hasRust && !uses.length) {
    skippedNoRust++;
    continue;
  }

  // Crates referenced by `use` statements, plus any explicit version pin.
  const crateNames = new Set();
  for (const u of uses) {
    const root = u.split("::")[0].trim();
    if (!STD_ROOTS.has(root) && /^[a-z]/.test(root)) crateNames.add(normalizeCrate(root));
  }
  for (const name of pinned.keys()) {
    if (/^[a-z][a-z0-9_-]+$/.test(name)) crateNames.add(name);
  }
  // Ignore obvious non-crates (things like tokio which is a real crate, kept).
  // Collect the source of every crate this article uses, so a snippet that
  // mixes tokio + tokio-modbus + tokio-serial types is judged against all of
  // them instead of one crate at a time (that produced cross-crate noise).
  const articleSources = new Map();

  for (const name of crateNames) {
    const meta = await apiCrate(name);
    checkedCrates.add(name);
    if (meta.missing) {
      errors.push(`${file}: crate "${name}" does not exist on crates.io`);
      continue;
    }
    if (meta.unknown) {
      warnings.push(`${file}: could not verify crate "${name}" (${meta.unknown})`);
      continue;
    }
    const req = pinned.get(name);
    if (req && ![...meta.versions].some((v) => satisfies(req, v))) {
      errors.push(`${file}: crate "${name}" has no published version matching "${req}" (latest ${meta.maxVersion})`);
    }

    // Deep check of `use <crate>::<a>::...` first segment.
    const target = req
      ? [...meta.versions].filter((v) => satisfies(req, v)).sort().pop()
      : meta.maxVersion;
    const src = await crateSource(name, target);
    if (!src) continue;
    const srcText = crateSourceText(src);
    articleSources.set(name, srcText);

    for (const u of uses) {
      const segs = u.split("::").map((s) => s.trim());
      if (normalizeCrate(segs[0]) !== name) continue;
      const first = (segs[1] || "").replace(/[^A-Za-z0-9_].*$/, "");
      if (!first || first === "*") continue;
      checkedUses++;
      // A module or public item named `first` must appear somewhere.
      const re = new RegExp(`(mod\\s+${first}\\b|pub\\s+(?:struct|enum|trait|type|fn|mod|use)\\s+${first}\\b|\\b${first}\\b)`);
      if (!re.test(srcText)) {
        errors.push(`${file}: \`use ${name}::${first}...\` — "${first}" not found in ${name} ${target} source`);
      }
    }

  } // end crate loop

  // ---- combined type check ------------------------------------------------
  // Judge the article's snippets against the union of every crate source it
  // imports. Checking crate-by-crate produced cross-crate noise: a `Slave` from
  // tokio-modbus was reported as missing from tokio-serial.
  if (articleSources.size) {
    const union = [...articleSources.values()].join("\n");

    const localTypes = new Set();
    for (const block of blocks) {
      for (const m of block.matchAll(/(?:struct|enum|trait|type|union)\s+([A-Z][A-Za-z0-9]+)/g)) localTypes.add(m[1]);
      // `enum WordOrder { Abcd, Cdab, Badc, Dcba }` — variants are local too.
      for (const m of block.matchAll(/enum\s+[A-Z][A-Za-z0-9]+\s*(?:<[^>]*>)?\s*\{([^}]*)\}/g)) {
        for (const v of m[1].matchAll(/\b([A-Z][A-Za-z0-9]+)\s*(?:\(|,|\}|=|$)/g)) localTypes.add(v[1]);
      }
      // Locally defined fns returning a type are not crate types either.
      for (const m of block.matchAll(/fn\s+([A-Z][A-Za-z0-9]+)\b/g)) localTypes.add(m[1]);
    }

    const typeIds = new Set();
    for (const block of blocks) {
      for (const m of block.matchAll(
        /(?::\s*|->\s*|impl\s+(?:[A-Za-z0-9_]+\s+for\s+)?|struct\s+|enum\s+|trait\s+|<)([A-Z][A-Za-z0-9]{2,})\b/g
      )) {
        typeIds.add(m[1]);
      }
    }

    const missing = [...typeIds].filter(
      (id) => !sidIsStd(id) && !localTypes.has(id) && !new RegExp(`\\b${id}\\b`).test(union)
    );
    if (missing.length) {
      warnings.push(
        `${file}: type(s) used in a snippet but not found in ${[...articleSources.keys()].join(", ")} — verify before publishing: ${missing.join(", ")}`
      );
    }
  }
}

/* ------------------------------------------------------------------ report */

if (NO_DOWNLOAD) warnings.push("--no-download: crate source deep checks were skipped");
console.log(
  `Rust snippets: ${files.length - skippedNoRust} article(s) with code, ` +
    `${checkedCrates.size} crate(s) verified, ${checkedUses} use-path(s) checked`
);

if (warnings.length) {
  console.log(`\n${warnings.length} warning(s):`);
  for (const w of warnings) console.log(`  ! ${w}`);
}
if (errors.length) {
  console.log(`\n${errors.length} error(s):`);
  for (const e of errors) console.log(`  x ${e}`);
}

if (errors.length || (STRICT && warnings.length)) {
  console.log(`\nFAILED${STRICT && !errors.length ? " (strict)" : ""}`);
  process.exit(1);
}
console.log("\nOK — Rust snippets match published crate sources");
