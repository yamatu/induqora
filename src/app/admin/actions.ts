"use server";

import { randomBytes } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { revalidateAllSiteContent } from "@/lib/revalidate";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin, requireUser } from "@/lib/auth";
import { deleteBackup, saveBackup } from "@/lib/backup";
import { db } from "@/lib/db";
import { renderMarkdown } from "@/lib/markdown";
import { SESSION_COOKIE, SESSION_TTL_SECONDS, signSession } from "@/lib/session";
import { ALLOWED_MIME, MAX_UPLOAD_BYTES, UPLOAD_ROOT, resolveUpload } from "@/lib/uploads";
import { readingMinutes, slugify, type Faq, type Source } from "@/lib/utils";

export type ActionState = { ok: boolean; message: string; errors?: Record<string, string> };

function str(fd: FormData, key: string) {
  return String(fd.get(key) ?? "").trim();
}

async function revalidateSite(slug?: string) {
  // Purges home, listings, feeds, taxonomy archives and the admin panel itself,
  // so the dashboard count is never left showing a stale article total.
  await revalidateAllSiteContent(slug);
}

/* ---------- Auth ---------- */

const loginAttempts = new Map<string, { count: number; until: number }>();

export async function login(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const email = str(fd, "email").toLowerCase();
  const password = String(fd.get("password") ?? "");

  const lock = loginAttempts.get(email);
  if (lock && lock.until > Date.now()) return { ok: false, message: "Too many failed attempts. Try again in 15 minutes." };

  const user = await db.adminUser.findUnique({ where: { email } });
  // Hash anyway for unknown emails so response timing doesn't reveal which accounts exist.
  const valid = user ? await bcrypt.compare(password, user.passwordHash) : (await bcrypt.hash(password, 12), false);
  if (!user || !valid) {
    const count = (lock?.count ?? 0) + 1;
    loginAttempts.set(email, { count, until: count >= 5 ? Date.now() + 15 * 60 * 1000 : 0 });
    return { ok: false, message: "Invalid email or password." };
  }

  loginAttempts.delete(email);
  await db.adminUser.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  const token = await signSession({ sub: user.id, email: user.email, name: user.name, role: user.role });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  redirect("/admin");
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/admin/login");
}

/* ---------- Posts ---------- */

function parseFaqs(raw: string): Faq[] {
  const faqs: Faq[] = [];
  let current: Faq | null = null;
  for (const line of raw.split(/\r?\n/)) {
    const q = line.match(/^\s*Q:\s*(.+)$/i);
    const a = line.match(/^\s*A:\s*(.+)$/i);
    if (q) {
      if (current?.q && current.a) faqs.push(current);
      current = { q: q[1].trim(), a: "" };
    } else if (a && current) {
      current.a = a[1].trim();
    } else if (current?.a && line.trim()) {
      current.a += ` ${line.trim()}`;
    }
  }
  if (current?.q && current.a) faqs.push(current);
  return faqs;
}

function parseSources(raw: string): Source[] {
  return raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const [title, url = ""] = l.split("|").map((s) => s.trim());
      return { title, url: /^https?:\/\//.test(url) ? url : "" };
    })
    .filter((s) => s.title);
}

function parseUtc(value: string) {
  if (!value) return null;
  const d = new Date(/Z|[+-]\d\d:\d\d$/.test(value) ? value : `${value}:00Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

const postSchema = z.object({
  title: z.string().min(10, "Title should be at least 10 characters.").max(200),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug may contain lowercase letters, numbers and hyphens only.").max(100),
  type: z.enum(["NEWS", "BLOG"]),
  status: z.enum(["DRAFT", "PUBLISHED"]),
  excerpt: z.string().min(50, "Excerpt should be at least 50 characters — it is used as the meta description fallback.").max(320),
  content: z.string().min(1, "Content is required."),
  categoryId: z.string().min(1, "Choose a category."),
  authorId: z.string().min(1, "Choose an author."),
  seoTitle: z.string().max(70, "SEO title should be 70 characters or fewer."),
  seoDescription: z.string().max(170, "Meta description should be 170 characters or fewer."),
  canonicalUrl: z.union([z.literal(""), z.url({ protocol: /^https?$/, error: "Canonical URL must be a full http(s) URL." })]),
  coverImage: z.string().max(500),
  coverAlt: z.string().max(200),
  coverCaption: z.string().max(300),
});

export async function savePost(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireUser();
  const id = str(fd, "id");
  const title = str(fd, "title");
  const input = {
    title,
    slug: slugify(str(fd, "slug") || title),
    type: str(fd, "type"),
    status: str(fd, "status"),
    excerpt: str(fd, "excerpt"),
    content: String(fd.get("content") ?? ""),
    categoryId: str(fd, "categoryId"),
    authorId: str(fd, "authorId"),
    seoTitle: str(fd, "seoTitle"),
    seoDescription: str(fd, "seoDescription"),
    canonicalUrl: str(fd, "canonicalUrl"),
    coverImage: str(fd, "coverImage"),
    coverAlt: str(fd, "coverAlt"),
    coverCaption: str(fd, "coverCaption"),
  };

  const parsed = postSchema.safeParse(input);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) errors[String(issue.path[0])] = issue.message;
    return { ok: false, message: "Please fix the highlighted fields.", errors };
  }
  const data = parsed.data;
  if (data.coverImage && !data.coverAlt) {
    return { ok: false, message: "Please fix the highlighted fields.", errors: { coverAlt: "Alt text is required when a cover image is set." } };
  }

  const clash = await db.post.findFirst({ where: { slug: data.slug, NOT: id ? { id } : undefined }, select: { id: true } });
  if (clash) return { ok: false, message: "Please fix the highlighted fields.", errors: { slug: "Another article already uses this slug." } };

  const tagNames = str(fd, "tags")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 12);
  const tagIds: string[] = [];
  for (const name of tagNames) {
    const slug = slugify(name);
    if (!slug) continue;
    const tag = await db.tag.upsert({ where: { slug }, update: {}, create: { slug, name } });
    tagIds.push(tag.id);
  }

  const existing = id ? await db.post.findUnique({ where: { id }, select: { publishedAt: true, status: true } }) : null;
  let publishedAt = parseUtc(str(fd, "publishedAt"));
  if (data.status === "PUBLISHED" && !publishedAt) publishedAt = existing?.publishedAt ?? new Date();
  const bumpModified = fd.get("bumpModified") === "on";

  const record = {
    ...data,
    keyTakeaways: str(fd, "keyTakeaways"),
    faqs: JSON.stringify(parseFaqs(String(fd.get("faqs") ?? ""))),
    sources: JSON.stringify(parseSources(String(fd.get("sources") ?? ""))),
    featured: fd.get("featured") === "on",
    noindex: fd.get("noindex") === "on",
    readingMinutes: readingMinutes(data.content),
    publishedAt,
  };

  let savedId = id;
  if (id) {
    await db.post.update({
      where: { id },
      data: {
        ...record,
        ...(bumpModified || (existing?.status !== "PUBLISHED" && data.status === "PUBLISHED") ? { modifiedAt: new Date() } : {}),
        tags: { set: tagIds.map((tid) => ({ id: tid })) },
      },
    });
  } else {
    const created = await db.post.create({
      data: { ...record, modifiedAt: publishedAt ?? new Date(), tags: { connect: tagIds.map((tid) => ({ id: tid })) } },
    });
    savedId = created.id;
  }

  await revalidateSite(input.slug);
  if (!id) redirect(`/admin/posts/${savedId}?saved=1`);
  return { ok: true, message: data.status === "PUBLISHED" ? "Article saved and published." : "Draft saved." };
}

export async function deletePost(fd: FormData) {
  await requireUser();
  const removed = await db.post.delete({ where: { id: str(fd, "id") }, select: { slug: true } });
  await revalidateSite(removed.slug);
  redirect("/admin/posts");
}

export async function previewMarkdown(markdown: string) {
  await requireUser();
  return renderMarkdown(markdown).html;
}

/* ---------- Categories & tags ---------- */

export async function saveCategory(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireUser();
  const id = str(fd, "id");
  const name = str(fd, "name");
  const slug = slugify(str(fd, "slug") || name);
  if (name.length < 2 || !slug) return { ok: false, message: "Name is required." };
  const data = { name, slug, description: str(fd, "description"), sortOrder: Number(str(fd, "sortOrder")) || 0 };
  const clash = await db.category.findFirst({ where: { slug, NOT: id ? { id } : undefined } });
  if (clash) return { ok: false, message: "Another category already uses this slug." };
  if (id) await db.category.update({ where: { id }, data });
  else await db.category.create({ data });
  await revalidateSite();
  redirect("/admin/categories");
}

export async function deleteCategory(fd: FormData) {
  await requireUser();
  const id = str(fd, "id");
  const count = await db.post.count({ where: { categoryId: id } });
  if (count > 0) redirect(`/admin/categories?error=${encodeURIComponent(`This category still has ${count} article(s). Move them first.`)}`);
  await db.category.delete({ where: { id } });
  await revalidateSite();
  redirect("/admin/categories");
}

export async function saveTag(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireUser();
  const id = str(fd, "id");
  const name = str(fd, "name");
  const slug = slugify(str(fd, "slug") || name);
  if (name.length < 2 || !slug) return { ok: false, message: "Name is required." };
  const data = { name, slug, description: str(fd, "description") };
  const clash = await db.tag.findFirst({ where: { slug, NOT: id ? { id } : undefined } });
  if (clash) return { ok: false, message: "Another tag already uses this slug." };
  if (id) await db.tag.update({ where: { id }, data });
  else await db.tag.create({ data });
  await revalidateSite();
  redirect("/admin/tags");
}

export async function deleteTag(fd: FormData) {
  await requireUser();
  await db.tag.delete({ where: { id: str(fd, "id") } });
  await revalidateSite();
  redirect("/admin/tags");
}

/* ---------- Authors ---------- */

const urlOrEmpty = z.union([z.literal(""), z.url({ protocol: /^https?$/ })]);

export async function saveAuthor(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireUser();
  const id = str(fd, "id");
  const name = str(fd, "name");
  const slug = slugify(str(fd, "slug") || name);
  if (name.length < 2 || !slug) return { ok: false, message: "Name is required." };
  const links = { linkedinUrl: str(fd, "linkedinUrl"), xUrl: str(fd, "xUrl"), websiteUrl: str(fd, "websiteUrl") };
  for (const [k, v] of Object.entries(links)) {
    if (!urlOrEmpty.safeParse(v).success) return { ok: false, message: `${k} must be a full URL (https://…).` };
  }
  const data = {
    name,
    slug,
    jobTitle: str(fd, "jobTitle"),
    bio: str(fd, "bio"),
    avatarUrl: str(fd, "avatarUrl"),
    expertise: str(fd, "expertise"),
    ...links,
  };
  const clash = await db.author.findFirst({ where: { slug, NOT: id ? { id } : undefined } });
  if (clash) return { ok: false, message: "Another author already uses this slug." };
  if (id) await db.author.update({ where: { id }, data });
  else await db.author.create({ data });
  await revalidateSite();
  redirect("/admin/authors");
}

export async function deleteAuthor(fd: FormData) {
  await requireUser();
  const id = str(fd, "id");
  const count = await db.post.count({ where: { authorId: id } });
  if (count > 0) redirect(`/admin/authors?error=${encodeURIComponent(`This author still has ${count} article(s). Reassign them first.`)}`);
  await db.author.delete({ where: { id } });
  await revalidateSite();
  redirect("/admin/authors");
}

/* ---------- Media ---------- */

export async function uploadMedia(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireUser();
  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, message: "Choose an image to upload." };
  const ext = ALLOWED_MIME[file.type];
  if (!ext) return { ok: false, message: "Only JPEG, PNG, WebP, GIF and AVIF images are allowed." };
  if (file.size > MAX_UPLOAD_BYTES) return { ok: false, message: "Images must be 8 MB or smaller." };

  const now = new Date();
  const dir = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const base = slugify(path.parse(file.name).name).slice(0, 60) || "image";
  const filename = `${base}-${randomBytes(4).toString("hex")}${ext}`;
  const target = resolveUpload([...dir.split("/"), filename]);
  if (!target) return { ok: false, message: "Invalid file name." };

  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, Buffer.from(await file.arrayBuffer()));
  await db.media.create({
    data: { filename, url: `/media/${dir}/${filename}`, mime: file.type, size: file.size, alt: str(fd, "alt") },
  });
  revalidatePath("/admin/media");
  return { ok: true, message: `Uploaded ${filename}` };
}

export async function deleteMedia(fd: FormData) {
  await requireUser();
  const media = await db.media.findUnique({ where: { id: str(fd, "id") } });
  if (media) {
    const target = resolveUpload(media.url.replace(/^\/media\//, "").split("/"));
    if (target && target.startsWith(UPLOAD_ROOT)) await unlink(target).catch(() => undefined);
    await db.media.delete({ where: { id: media.id } });
  }
  revalidatePath("/admin/media");
}

/* ---------- Subscribers & messages ---------- */

export async function deleteSubscriber(fd: FormData) {
  await requireUser();
  await db.subscriber.delete({ where: { id: str(fd, "id") } });
  revalidatePath("/admin/subscribers");
}

export async function toggleMessageRead(fd: FormData) {
  await requireUser();
  const id = str(fd, "id");
  const msg = await db.contactMessage.findUnique({ where: { id } });
  if (msg) await db.contactMessage.update({ where: { id }, data: { read: !msg.read } });
  revalidatePath("/admin/messages");
}

export async function deleteMessage(fd: FormData) {
  await requireUser();
  await db.contactMessage.delete({ where: { id: str(fd, "id") } });
  revalidatePath("/admin/messages");
}

/* ---------- Users ---------- */

export async function createUser(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const email = str(fd, "email").toLowerCase();
  const name = str(fd, "name");
  const password = String(fd.get("password") ?? "");
  const role = str(fd, "role") === "ADMIN" ? "ADMIN" : "EDITOR";
  if (!z.email().safeParse(email).success) return { ok: false, message: "Enter a valid email." };
  if (name.length < 2) return { ok: false, message: "Enter a name." };
  if (password.length < 12) return { ok: false, message: "Password must be at least 12 characters." };
  if (await db.adminUser.findUnique({ where: { email } })) return { ok: false, message: "A user with this email already exists." };
  await db.adminUser.create({ data: { email, name, role, passwordHash: await bcrypt.hash(password, 12) } });
  revalidatePath("/admin/users");
  return { ok: true, message: `Created ${email}.` };
}

export async function deleteUser(fd: FormData) {
  const session = await requireAdmin();
  const id = str(fd, "id");
  if (id === session.sub) return;
  await db.adminUser.delete({ where: { id } });
  revalidatePath("/admin/users");
}

export async function changePassword(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const session = await requireUser();
  const current = String(fd.get("current") ?? "");
  const next = String(fd.get("next") ?? "");
  if (next.length < 12) return { ok: false, message: "New password must be at least 12 characters." };
  const user = await db.adminUser.findUnique({ where: { id: session.sub } });
  if (!user || !(await bcrypt.compare(current, user.passwordHash))) return { ok: false, message: "Current password is incorrect." };
  await db.adminUser.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(next, 12) } });
  return { ok: true, message: "Password updated." };
}

/* ---------- Backups ---------- */

export async function createServerBackup() {
  await requireAdmin();
  await saveBackup("manual");
  revalidatePath("/admin/backup");
}

export async function removeServerBackup(fd: FormData) {
  await requireAdmin();
  await deleteBackup(str(fd, "name"));
  revalidatePath("/admin/backup");
}
