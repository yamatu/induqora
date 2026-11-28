#!/usr/bin/env bash
# Zero-build article publisher for Induqora.
# Imports Markdown articles from prisma/content/ into the live SQLite database,
# optionally renders matching covers/diagrams via sharp inside the running container,
# and triggers POST /api/revalidate so changes appear immediately without rebuilding Next.js.
#
# Every article goes through scripts/validate-posts.mjs first, and every published
# URL is checked for HTTP 200 afterwards. Both steps exist because of failures that
# shipped once: a future publishedAt (row in DB, URL 404) and a mistyped category.
#
# Usage:
#   ./scripts/publish-posts.sh article-a.md [article-b.md ...]
#   ./scripts/publish-posts.sh --with-images article-a.md [article-b.md ...]
#   ./scripts/publish-posts.sh --strict --with-images article-a.md   # warnings fail too
#   ./scripts/publish-posts.sh --skip-validate article-a.md          # emergency only

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CONTAINER="${INDUQORA_CONTAINER:-induqora-app-1}"
WITH_IMAGES=false
SKIP_VALIDATE=false
VALIDATE_ARGS=()
FILES=()

for arg in "$@"; do
  case "$arg" in
    --with-images) WITH_IMAGES=true ;;
    --skip-validate) SKIP_VALIDATE=true ;;
    --strict) VALIDATE_ARGS+=("--strict") ;;
    -h|--help)
      sed -n '2,16p' "$0"
      exit 0
      ;;
    *)
      FILES+=("$(basename "$arg")")
      ;;
  esac
done

if [ "${#FILES[@]}" -eq 0 ]; then
  echo "Usage: $0 [--with-images] [--strict] [--skip-validate] <file1.md> [file2.md ...]" >&2
  exit 1
fi

SLUGS=()
TYPES=()
for f in "${FILES[@]}"; do
  full="$ROOT/prisma/content/$f"
  if [ ! -f "$full" ]; then
    echo "Error: missing $full" >&2
    exit 1
  fi
  # Ensure the non-root `node` user inside the container can read newly created host files.
  chmod a+r "$full" 2>/dev/null || true
  slug="$(awk -F': ' '/^slug:/{print $2; exit}' "$full" | tr -d '\r')"
  type="$(awk -F': ' '/^type:/{print $2; exit}' "$full" | tr -d '\r')"
  if [ -z "$slug" ]; then
    echo "Error: missing slug frontmatter in $f" >&2
    exit 1
  fi
  SLUGS+=("$slug")
  TYPES+=("${type:-BLOG}")
done

echo "[0/4] Validating frontmatter, SEO lengths, dates, links, diagrams and Rust snippets..."
if [ "$SKIP_VALIDATE" = "true" ]; then
  echo "      skipped via --skip-validate"
else
  node "$ROOT/scripts/validate-posts.mjs" "${VALIDATE_ARGS[@]}" "${FILES[@]}"
  # Catches a diagram spec that is defined but never registered, a diagram type
  # that does not exist, and an unescaped "<" in generated SVG.
  node "$ROOT/scripts/check-visuals.mjs"
  # Catches Rust snippets whose crate, version or API does not exist. Requires
  # network on first run (crate sources are cached in $TMPDIR afterwards).
  node "$ROOT/scripts/check-rust-snippets.mjs" "${FILES[@]}" || echo "      Rust snippet check reported problems (see above)"
fi

chmod a+r "$ROOT/prisma/seed.mjs" "$ROOT"/scripts/*.mjs 2>/dev/null || true

echo "[1/4] Seeding ${#FILES[@]} article(s) into live SQLite (no frontend build)..."
docker exec "$CONTAINER" node /app/prisma/seed.mjs --no-revalidate "${FILES[@]}"

if [ "$WITH_IMAGES" = "true" ]; then
  SLUG_CSV="$(IFS=,; echo "${SLUGS[*]}")"
  echo "[2/4] Rendering cover/diagram images inside $CONTAINER for: $SLUG_CSV"
  docker exec -e FONTCONFIG_FILE=/etc/fonts/fonts.conf "$CONTAINER" \
    node /app/scripts/generate-article-images.mjs --render-and-db "--only=$SLUG_CSV"
  echo "      Syncing image references back into host prisma/content/*.md..."
  node "$ROOT/scripts/generate-article-images.mjs" --sync-markdown "--content-dir=$ROOT/prisma/content" "--only=$SLUG_CSV"
else
  echo "[2/4] Skipping image generation (pass --with-images to render covers/diagrams)."
fi

echo "[3/4] Revalidating Next.js cache and warming published URLs..."
docker exec "$CONTAINER" node -e '
const base = `http://127.0.0.1:${process.env.PORT || 3000}`;
const res = await fetch(`${base}/api/revalidate`, {
  method: "POST",
  headers: { "x-revalidate-secret": process.env.AUTH_SECRET ?? "" },
});
if (!res.ok) {
  console.error("Revalidate failed:", res.status, await res.text());
  process.exit(1);
}
console.log("Revalidate response:", await res.text());
'

echo "[4/4] Verifying every published URL returns HTTP 200..."
FAILED=0
for i in "${!SLUGS[@]}"; do
  prefix="blog"
  [ "${TYPES[$i]}" = "NEWS" ] && prefix="news"
  url="http://127.0.0.1:3000/$prefix/${SLUGS[$i]}"
  code="$(curl -s -o /dev/null -w '%{http_code}' "$url")"
  echo "  GET /$prefix/${SLUGS[$i]} -> HTTP $code"
  if [ "$code" != "200" ]; then
    FAILED=1
    if [ "$code" = "404" ]; then
      echo "      404 usually means publishedAt is in the future (publishedWhere filters publishedAt <= now)." >&2
      echo "      Check the publishedAt line in prisma/content/${SLUGS[$i]}.md" >&2
    fi
  fi
done
curl -s -o /dev/null "http://127.0.0.1:3000/"
curl -s -o /dev/null "http://127.0.0.1:3000/sitemap.xml"

if [ "$FAILED" != "0" ]; then
  echo "Published, but at least one URL did not return 200 — see above." >&2
  exit 1
fi
echo "Done — published with 0 frontend rebuild, all URLs 200."
