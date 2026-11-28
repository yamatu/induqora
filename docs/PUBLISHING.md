# Publishing checklist

Every rule in this document exists because the failure already happened once.
The scripts enforce them before publishing; this file explains why.

## One command

```bash
./scripts/publish-posts.sh --with-images prisma/content/my-article.md
```

The script runs five steps and stops at the first blocking error:

| Step | What it does | Script |
|---|---|---|
| 0 | Validate frontmatter, dates, SEO lengths, links, diagrams, Rust snippets | `validate-posts.mjs`, `check-visuals.mjs`, `check-rust-snippets.mjs` |
| 1 | Upsert the Markdown into SQLite | `prisma/seed.mjs` |
| 2 | Render cover + diagram, sync URLs back into the `.md` | `generate-article-images.mjs` |
| 3 | Revalidate the Next.js cache | `POST /api/revalidate` |
| 4 | Assert every published URL returns HTTP 200 | `curl` loop |

Run all checks without publishing:

```bash
npm run check:all
```

## The failures these checks prevent

### 1. Article published but the URL 404s

`src/lib/posts.ts` filters with `publishedAt: { lte: new Date() }`. A future
timestamp therefore inserts the row, prints `Seeded BLOG ...`, and serves 404 —
the file is on disk, the database has it, the page does not exist.

`validate-posts.mjs` fails on `publishedAt` more than 60 s in the future, and
step 4 of `publish-posts.sh` re-checks every URL, printing the cause on 404.

### 2. Mistyped category or author

`seed.mjs` used `findUniqueOrThrow`, which surfaced a bare Prisma error after
some files in the same batch had already been imported, leaving a half-published
set. It now lists the valid slugs:

```
my-article.md: category "iiot-edg" does not exist.
  Valid categories: iiot-edge, industrial-networking, ...
```

`validate-posts.mjs` reads those valid slugs straight out of `seed.mjs`, so there
is a single source of truth.

### 3. Rust snippets with APIs that do not exist

Code was written from memory twice and both times the API was wrong
(`MainDeviceConfig.timeouts`, `cert.not_after`). Readers copy snippets verbatim.

`check-rust-snippets.mjs` downloads the pinned crate source from crates.io and
verifies that:

- the crate exists,
- the pinned version exists,
- the first path segment of every `use crate::...` is real,
- types used in type position appear in the crate source (or are declared
  locally in the snippet).

Sources are cached in `$TMPDIR/induqora-crate-cache`, so after the first run the
check works offline. Use `--no-download` to skip the deep checks.

### 4. Diagram that is defined but never rendered

Adding a diagram batch requires three registrations:

1. `scripts/render-diagrams-<x>.mjs` imported **and** chained inside
   `renderDiagramSvg()` in `render-diagrams.mjs`
2. `scripts/visual-specs-batch<n>.mjs` imported **and** spread into
   `ALL_VISUALS` in `generate-article-images.mjs`
3. a real `prisma/content/<file>.md` whose frontmatter slug equals the spec slug

Forgetting any of them produced either `Unknown diagram type` inside Docker or a
silently missing image. `check-visuals.mjs` verifies all three and renders every
diagram once.

An unescaped `<` in a label produces invalid XML, and the diagram does not
display at all. The checker scans generated SVG for a `<` that does not start a
tag, and `validate-posts.mjs` runs `xmllint` over rendered files when available.

### 5. Weak tags burning crawl budget

`/tag/<slug>` is `noindex` below 3 posts. Every post page links its tags, so a
thin tag sends crawlers to a page that refuses indexing. Both validators warn
when a new article introduces a tag with fewer than 3 posts: reuse an existing
tag or add the missing articles.

### 6. Orphan articles

An article with zero inbound internal links gets no internal PageRank and is
crawled late. `validate-posts.mjs` warns when a file being published has no
inbound link, so add one from a related article before publishing.

## Admin shows a stale post count

`/admin` is force-dynamic and `next.config.ts` sends
`Cache-Control: private, no-store` for `/admin/*` and `/api/*`, so the count is
always read from SQLite. The number to trust is:

```bash
docker exec induqora-app-1 node -e "
const {PrismaClient}=require('@prisma/client');const db=new PrismaClient();
db.post.count().then(n=>{console.log('posts:',n);return db['\$disconnect']()});
"
```

If the browser still shows an old number, hard-reload once: the previous HTML was
cached before those headers existed.

## Commands that need care

- Do not use `--skip-validate` unless a check itself is broken; it disables every
  guard above.
- `--strict` turns warnings into failures, which is the right setting for a
  normal publishing day.
