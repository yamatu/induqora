# Induqora — induqora.com

Industrial Automation & Control news and insights. Next.js 16 (App Router) · TypeScript · Prisma (SQLite by default) · Tailwind CSS v4.

## Quick start

```bash
npm install
cp .env.example .env        # then edit AUTH_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
npm run setup               # create DB schema + seed categories, authors, sample articles, admin user
npm run dev                 # http://localhost:3000  — admin at /admin
```

`SITE_URL` is read at runtime and used for canonical URLs, sitemaps, feeds and JSON-LD.

## Docker Compose deployment (recommended)

Runs the app plus Caddy (automatic HTTPS, `www` → apex redirect). Database and uploads live in the `induqora-data` volume.

```bash
cp .env.production.example .env.production   # set DOMAIN, SITE_URL, AUTH_SECRET, ADMIN_PASSWORD
docker compose up -d --build
docker compose logs -f app
```

- Point DNS `A`/`AAAA` records for `DOMAIN` and `www.DOMAIN` to the server and open ports 80/443 before starting.
- On first start the container creates the database, seeds categories/authors/sample articles and the admin user. Later starts only sync the schema (`prisma db push`) — existing content is never overwritten.
- The app is also published on `127.0.0.1:3000` for SSH-tunnel debugging. Already running Nginx or another proxy? Start only the app with `docker compose up -d --build app` and proxy to `127.0.0.1:3000`, passing `Host` and `X-Forwarded-For`.
- Update: `git pull && docker compose up -d --build`.
- Backups: use Admin → Backup & restore (see below). Copy files off the server regularly, e.g. `docker compose cp app:/app/data/backups ./backups`.

## Content model

- **News** (`/news/[slug]`, `NewsArticle` schema) and **Insights** (`/blog/[slug]`, `BlogPosting` schema)
- Categories (`/category/…`), tags (`/tag/…`, noindex until 2+ articles), authors (`/author/…`)
- Per article: excerpt, Markdown body, key takeaways, FAQs, cited sources, cover image, SEO title/description, canonical override, noindex, featured flag, scheduled publishing (future publish date), honest "Updated" date (only bumped on substantive edits)

Sample articles live in `prisma/content/*.md` and are upserted by `npm run db:seed`.

## SEO / GEO endpoints

| Path | Purpose |
|---|---|
| `/sitemap.xml` | All indexable URLs with lastmod and images |
| `/news-sitemap.xml` | Google News sitemap (last 48 h) |
| `/robots.txt` | Allows search and AI crawlers, blocks `/admin`, `/api`, `/search` |
| `/rss.xml`, `/feed.json` | Full-content feeds |
| `/llms.txt`, `/llms-full.txt` | Site map and full article text for LLM / answer engines |
| `/og/[slug]` | Generated 1200×630 social images |

## Admin

`/admin` — articles (Markdown editor with preview, SERP preview, quality checklist), categories, tags, authors, media library (uploads stored in `UPLOAD_DIR`, served from `/media/*`), newsletter subscribers (CSV export), contact messages, users and password change.

## Backup & restore

Admin → **Backup & restore** (administrators only):

- **Download backup now** — one `.json.gz` file with all articles, categories, tags, authors, media (including image files), subscribers, messages and admin accounts. Treat it as sensitive.
- **Restore / import** — upload a backup file or pick one stored on the server.
  - *Merge*: adds new items and updates items with the same slug / URL / email; nothing is deleted. Use this to move articles written locally onto induqora.com.
  - *Replace*: deletes current content first, then restores the backup exactly. Use for disaster recovery.
  - Admin accounts are only restored when explicitly ticked, so your current logins keep working.
- A `pre-restore-*` safety backup is written automatically before every restore (last 5 kept).
- Scheduled backups run every `BACKUP_INTERVAL_HOURS` (default 24, `0` disables) and keep the latest `BACKUP_KEEP` (default 14) in `BACKUP_DIR` (`/app/data/backups` in Docker, inside the `induqora-data` volume).

Typical workflow — local → production: write and review articles in the local install, *Download backup now*, then on induqora.com open Backup & restore, upload the file and choose *Merge*.

## Testing

With the server running: `npm run test:e2e -- http://localhost:3000` submits real forms against the server actions (login, create/publish/delete article, media upload, newsletter, contact). It creates and then deletes a test article and media item; test subscribers/messages it leaves behind are prefixed `e2e`.

## Deployment notes

- SQLite suits a single server. For multiple instances, switch `provider` in `prisma/schema.prisma` to `postgresql`, update `DATABASE_URL`, and move uploads to object storage.
- `POST /api/revalidate` with header `x-revalidate-secret: $AUTH_SECRET` purges all cached pages; the container calls it on startup.
