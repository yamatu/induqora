import { mkdir, readFile, readdir, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { gunzipSync, gzipSync } from "node:zlib";
import { z } from "zod";
import { db } from "./db";
import { siteConfig } from "./site";
import { EXT_MIME, UPLOAD_ROOT, resolveUpload } from "./uploads";

export const BACKUP_DIR = path.resolve(process.env.BACKUP_DIR || "./backups");
export const BACKUP_FORMAT = "induqora-backup";
export const BACKUP_VERSION = 1;
export const MAX_BACKUP_BYTES = 512 * 1024 * 1024;

const NAME_RE = /^(auto|manual|pre-restore)-\d{8}-\d{6}\.json\.gz$/;
type BackupKind = "auto" | "manual" | "pre-restore";

/* ---------- Schema of the backup file ---------- */

const str = z.string().default("");
const date = z.coerce.date();
const nullableDate = z.coerce.date().nullable().default(null);

const adminUserS = z.object({ id: z.string(), email: z.string().min(3), name: z.string(), passwordHash: z.string().min(20), role: z.enum(["ADMIN", "EDITOR"]), createdAt: date, lastLoginAt: nullableDate });
const authorS = z.object({ id: z.string(), slug: z.string().min(1), name: z.string().min(1), jobTitle: str, bio: str, avatarUrl: str, expertise: str, linkedinUrl: str, xUrl: str, websiteUrl: str, createdAt: date });
const categoryS = z.object({ id: z.string(), slug: z.string().min(1), name: z.string().min(1), description: str, sortOrder: z.number().int().default(0) });
const tagS = z.object({ id: z.string(), slug: z.string().min(1), name: z.string().min(1), description: str });
const postS = z.object({
  id: z.string(),
  slug: z.string().min(1),
  type: z.enum(["NEWS", "BLOG"]),
  status: z.enum(["DRAFT", "PUBLISHED"]),
  title: z.string().min(1),
  excerpt: str,
  content: str,
  keyTakeaways: str,
  faqs: z.string().default("[]"),
  sources: z.string().default("[]"),
  coverImage: str,
  coverAlt: str,
  coverCaption: str,
  seoTitle: str,
  seoDescription: str,
  canonicalUrl: str,
  noindex: z.boolean().default(false),
  featured: z.boolean().default(false),
  readingMinutes: z.number().int().default(1),
  publishedAt: nullableDate,
  modifiedAt: date,
  createdAt: date,
  authorId: z.string(),
  categoryId: z.string(),
  tagIds: z.array(z.string()).default([]),
});
const mediaS = z.object({ id: z.string(), filename: z.string(), url: z.string().startsWith("/media/"), mime: z.string(), size: z.number().int(), alt: str, createdAt: date });
const subscriberS = z.object({ id: z.string(), email: z.string().min(3), source: str, createdAt: date });
const messageS = z.object({ id: z.string(), name: z.string(), email: z.string(), company: str, subject: z.string(), message: z.string(), read: z.boolean().default(false), createdAt: date });

const backupS = z.object({
  format: z.literal(BACKUP_FORMAT),
  version: z.literal(BACKUP_VERSION),
  createdAt: z.string(),
  siteUrl: z.string().optional(),
  data: z.object({
    adminUsers: z.array(adminUserS).default([]),
    authors: z.array(authorS).default([]),
    categories: z.array(categoryS).default([]),
    tags: z.array(tagS).default([]),
    posts: z.array(postS).default([]),
    media: z.array(mediaS).default([]),
    subscribers: z.array(subscriberS).default([]),
    contactMessages: z.array(messageS).default([]),
  }),
  files: z.array(z.object({ path: z.string(), data: z.string() })).default([]),
});

export type BackupFile = z.infer<typeof backupS>;

/* ---------- Export ---------- */

async function walk(dir: string, base = dir): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
  const out: string[] = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (full === BACKUP_DIR) continue;
    if (e.isDirectory()) out.push(...(await walk(full, base)));
    else if (e.isFile() && EXT_MIME[path.extname(e.name).toLowerCase()]) out.push(path.relative(base, full).split(path.sep).join("/"));
  }
  return out;
}

export async function buildBackup(): Promise<Buffer> {
  const [adminUsers, authors, categories, tags, posts, media, subscribers, contactMessages] = await db.$transaction([
    db.adminUser.findMany(),
    db.author.findMany(),
    db.category.findMany(),
    db.tag.findMany(),
    db.post.findMany({ include: { tags: { select: { id: true } } } }),
    db.media.findMany(),
    db.subscriber.findMany(),
    db.contactMessage.findMany(),
  ]);

  const files = [];
  for (const rel of await walk(UPLOAD_ROOT)) {
    const full = resolveUpload(rel.split("/"));
    if (full) files.push({ path: rel, data: (await readFile(full)).toString("base64") });
  }

  const payload = {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    createdAt: new Date().toISOString(),
    siteUrl: siteConfig.url,
    data: {
      adminUsers,
      authors,
      categories,
      tags,
      posts: posts.map(({ tags: postTags, updatedAt: _updatedAt, ...p }) => ({ ...p, tagIds: postTags.map((t) => t.id) })),
      media,
      subscribers,
      contactMessages,
    },
    files,
  };
  return gzipSync(JSON.stringify(payload));
}

function stamp(d = new Date()) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}-${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}`;
}

export async function saveBackup(kind: BackupKind) {
  await mkdir(BACKUP_DIR, { recursive: true });
  const name = `${kind}-${stamp()}.json.gz`;
  await writeFile(path.join(BACKUP_DIR, name), await buildBackup());
  await prune(kind, kind === "auto" ? Number(process.env.BACKUP_KEEP || 14) : kind === "pre-restore" ? 5 : Infinity);
  return name;
}

export type StoredBackup = { name: string; kind: BackupKind; size: number; createdAt: Date };

export async function listBackups(): Promise<StoredBackup[]> {
  const names = (await readdir(BACKUP_DIR).catch(() => [] as string[])).filter((n) => NAME_RE.test(n));
  const items = await Promise.all(
    names.map(async (name) => {
      const s = await stat(path.join(BACKUP_DIR, name));
      return { name, kind: name.match(NAME_RE)![1] as BackupKind, size: s.size, createdAt: s.mtime };
    }),
  );
  return items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

async function prune(kind: BackupKind, keep: number) {
  if (!Number.isFinite(keep)) return;
  const old = (await listBackups()).filter((b) => b.kind === kind).slice(Math.max(1, keep));
  await Promise.all(old.map((b) => unlink(path.join(BACKUP_DIR, b.name)).catch(() => undefined)));
}

export function backupPath(name: string) {
  return NAME_RE.test(name) ? path.join(BACKUP_DIR, name) : null;
}

export async function deleteBackup(name: string) {
  const p = backupPath(name);
  if (p) await unlink(p).catch(() => undefined);
}

export async function runScheduledBackup(intervalHours: number) {
  const latest = (await listBackups()).find((b) => b.kind === "auto");
  if (latest && Date.now() - latest.createdAt.getTime() < intervalHours * 3600 * 1000 * 0.9) return;
  const name = await saveBackup("auto");
  console.log(`[induqora] scheduled backup saved: ${name}`);
}

/* ---------- Import ---------- */

export function parseBackup(raw: Buffer): BackupFile {
  const text = raw[0] === 0x1f && raw[1] === 0x8b ? gunzipSync(raw).toString("utf8") : raw.toString("utf8");
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error("The file is not a valid Induqora backup (could not parse JSON).");
  }
  const parsed = backupS.safeParse(json);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new Error(`Invalid backup file: ${issue.path.join(".")} — ${issue.message}`);
  }
  return parsed.data;
}

export type RestoreOptions = { mode: "merge" | "replace"; includeSubscribers: boolean; includeUsers: boolean };
export type RestoreResult = Record<string, number> & { files: number };

export async function restoreBackup(backup: BackupFile, opts: RestoreOptions): Promise<RestoreResult> {
  const d = backup.data;
  const result: RestoreResult = { authors: 0, categories: 0, tags: 0, posts: 0, media: 0, subscribers: 0, messages: 0, users: 0, files: 0 };

  await db.$transaction(
    async (tx) => {
      if (opts.mode === "replace") {
        await tx.post.deleteMany();
        await tx.tag.deleteMany();
        await tx.category.deleteMany();
        await tx.author.deleteMany();
        await tx.media.deleteMany();
        if (opts.includeSubscribers) {
          await tx.subscriber.deleteMany();
          await tx.contactMessage.deleteMany();
        }
        if (opts.includeUsers && d.adminUsers.length) await tx.adminUser.deleteMany();
      }

      const authorIds = new Map<string, string>();
      for (const { id, ...a } of d.authors) {
        const row = await tx.author.upsert({ where: { slug: a.slug }, update: a, create: a });
        authorIds.set(id, row.id);
        result.authors++;
      }
      const categoryIds = new Map<string, string>();
      for (const { id, ...c } of d.categories) {
        const row = await tx.category.upsert({ where: { slug: c.slug }, update: c, create: c });
        categoryIds.set(id, row.id);
        result.categories++;
      }
      const tagIds = new Map<string, string>();
      for (const { id, ...t } of d.tags) {
        const row = await tx.tag.upsert({ where: { slug: t.slug }, update: t, create: t });
        tagIds.set(id, row.id);
        result.tags++;
      }

      for (const { id: _id, tagIds: postTagIds, authorId, categoryId, ...p } of d.posts) {
        const mappedAuthor = authorIds.get(authorId);
        const mappedCategory = categoryIds.get(categoryId);
        if (!mappedAuthor || !mappedCategory) throw new Error(`Post "${p.slug}" references a missing author or category.`);
        const tags = postTagIds.map((t) => tagIds.get(t)).filter((t): t is string => Boolean(t)).map((tid) => ({ id: tid }));
        const data = { ...p, authorId: mappedAuthor, categoryId: mappedCategory };
        await tx.post.upsert({
          where: { slug: p.slug },
          update: { ...data, tags: { set: tags } },
          create: { ...data, tags: { connect: tags } },
        });
        result.posts++;
      }

      for (const { id: _id, ...m } of d.media) {
        await tx.media.upsert({ where: { url: m.url }, update: m, create: m });
        result.media++;
      }

      if (opts.includeSubscribers) {
        for (const { id: _id, ...s } of d.subscribers) {
          await tx.subscriber.upsert({ where: { email: s.email }, update: {}, create: s });
          result.subscribers++;
        }
        for (const { id: _id, ...m } of d.contactMessages) {
          const exists = await tx.contactMessage.findFirst({ where: { email: m.email, subject: m.subject, createdAt: m.createdAt }, select: { id: true } });
          if (!exists) {
            await tx.contactMessage.create({ data: m });
            result.messages++;
          }
        }
      }

      if (opts.includeUsers) {
        for (const { id: _id, ...u } of d.adminUsers) {
          await tx.adminUser.upsert({ where: { email: u.email }, update: u, create: u });
          result.users++;
        }
      }
    },
    { timeout: 300_000, maxWait: 20_000 },
  );

  for (const f of backup.files) {
    const target = resolveUpload(f.path.split("/"));
    if (!target || !EXT_MIME[path.extname(target).toLowerCase()]) continue;
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, Buffer.from(f.data, "base64"));
    result.files++;
  }

  return result;
}
