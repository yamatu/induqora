import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const categories = [
  {
    slug: "plc-controllers",
    name: "PLCs & Controllers",
    description:
      "Programmable logic controllers, PACs and industrial PCs: hardware selection, IEC 61131-3 programming, architecture and lifecycle management.",
  },
  {
    slug: "process-automation-dcs",
    name: "Process Automation & DCS",
    description:
      "Distributed control systems, instrumentation and process control strategy for continuous and batch industries, from loop tuning to alarm management.",
  },
  {
    slug: "scada-hmi",
    name: "SCADA & HMI",
    description: "Supervisory control, data acquisition and operator interfaces: architecture, high-performance HMI design, historians and remote operations.",
  },
  {
    slug: "industrial-networking",
    name: "Industrial Networking",
    description: "Fieldbuses and industrial Ethernet — PROFINET, EtherNet/IP, EtherCAT, Modbus, OPC UA, MQTT and TSN — explained for engineers who design and maintain plant networks.",
  },
  {
    slug: "ot-cybersecurity",
    name: "OT Cybersecurity",
    description: "Securing industrial control systems: IEC 62443, network segmentation, vulnerability management, incident response and regulatory compliance for operational technology.",
  },
  {
    slug: "motion-control-drives",
    name: "Motion Control & Drives",
    description: "Servo systems, variable frequency drives, motion controllers and safety functions for precise, efficient machine automation.",
  },
  {
    slug: "robotics",
    name: "Robotics",
    description: "Industrial and collaborative robots, robot safety, cell integration and the economics of robotic automation.",
  },
  {
    slug: "iiot-edge",
    name: "Industrial IoT & Edge",
    description: "Connecting machines to data: edge computing, unified namespace architectures, condition monitoring and IT/OT integration.",
  },
  {
    slug: "smart-manufacturing",
    name: "Smart Manufacturing",
    description: "Industry 4.0 in practice: MES, digital twins, OEE improvement, predictive maintenance and the business case for digital transformation.",
  },
  {
    slug: "standards-regulation",
    name: "Standards & Regulation",
    description: "The standards and laws that shape automation — IEC, ISO and ISA standards plus EU and US regulation affecting machine builders, vendors and plant operators.",
  },
  {
    slug: "suppliers-services",
    name: "Suppliers & Services",
    description:
      "Profiles of automation spare-parts suppliers, repair centers and service providers, based on published company information and reviewed by Induqora editors.",
  },
];

const authors = [
  {
    slug: "edward",
    name: "Edward",
    jobTitle: "Editor, Induqora",
    bio: "Edward writes and edits Induqora's coverage of industrial automation and control, including PLC programming, industrial networking, OT cybersecurity, process control and the regulation that shapes the automation industry.",
    expertise: "PLC programming, Industrial networking, OT cybersecurity, Process control, Automation regulation",
  },
];

function parseArticle(raw) {
  const text = raw.replace(/\r\n/g, "\n");
  const fm = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!fm) throw new Error("Missing frontmatter");
  const meta = {};
  for (const line of fm[1].split("\n")) {
    const i = line.indexOf(":");
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  const rest = text.slice(fm[0].length);
  const [body, ...blocks] = rest.split(/^=== /m);
  const block = (name) => blocks.find((b) => b.startsWith(name))?.slice(name.length).trim() ?? "";

  const faqs = [];
  for (const chunk of block("faqs").split(/\n(?=Q:)/)) {
    const m = chunk.match(/^Q:\s*([\s\S]+?)\nA:\s*([\s\S]+)$/);
    if (m) faqs.push({ q: m[1].trim(), a: m[2].trim().replace(/\s+/g, " ") });
  }
  const sources = block("sources")
    .split("\n")
    .filter(Boolean)
    .map((l) => {
      const [title, url = ""] = l.split("|").map((s) => s.trim());
      return { title, url };
    });

  return { meta, body: body.trim(), takeaways: block("takeaways"), faqs, sources };
}

function readingMinutes(markdown) {
  return Math.max(1, Math.round(markdown.split(/\s+/).filter(Boolean).length / 230));
}

async function revalidateRunningServer() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return;
  const base = `http://127.0.0.1:${process.env.PORT || 3000}`;
  try {
    const res = await fetch(`${base}/api/revalidate`, {
      method: "POST",
      headers: { "x-revalidate-secret": secret },
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      console.log("Revalidated live Next.js cache.");
    } else {
      console.warn(`Cache revalidation returned HTTP ${res.status}`);
    }
  } catch {
    // Expected during first-run bootstrap before server.js starts listening.
  }
}

/** Resolve a category/author slug with an actionable error message.
 *  findUniqueOrThrow used to surface a bare Prisma "record not found" after
 *  other posts in the same batch had already been imported. */
async function requireCategory(slug, file) {
  const row = await db.category.findUnique({ where: { slug } });
  if (row) return row;
  const valid = (await db.category.findMany({ select: { slug: true } })).map((c) => c.slug).sort();
  throw new Error(
    `${file}: category "${slug}" does not exist.\n` +
      `  Valid categories: ${valid.join(", ")}\n` +
      `  Hint: categories are defined in the \`categories\` array of prisma/seed.mjs.`
  );
}

async function requireAuthor(slug, file) {
  const row = await db.author.findUnique({ where: { slug } });
  if (row) return row;
  const valid = (await db.author.findMany({ select: { slug: true } })).map((a) => a.slug).sort();
  throw new Error(
    `${file}: author "${slug}" does not exist.\n` +
      `  Valid authors: ${valid.join(", ")}\n` +
      `  Hint: authors are defined in the \`authors\` array of prisma/seed.mjs.`
  );
}

async function main() {
  const email = (process.env.ADMIN_EMAIL || "admin@induqora.com").toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!password || password.length < 8) throw new Error("Set ADMIN_PASSWORD (8+ characters) in .env before seeding.");
  const existingAdmin = await db.adminUser.findUnique({ where: { email } });
  if (!existingAdmin) {
    await db.adminUser.create({ data: { email, name: "Administrator", role: "ADMIN", passwordHash: await bcrypt.hash(password, 12) } });
    console.log(`Created admin user ${email}`);
  }

  for (const [i, c] of categories.entries()) {
    await db.category.upsert({ where: { slug: c.slug }, update: {}, create: { ...c, sortOrder: i + 1 } });
  }
  for (const a of authors) {
    await db.author.upsert({ where: { slug: a.slug }, update: {}, create: a });
  }

  const dir = path.join(import.meta.dirname, "content");
  const rawArgs = process.argv.slice(2);
  const skipRevalidate = rawArgs.includes("--no-revalidate");
  // Optional CLI args limit the import to specific files, e.g. `node prisma/seed.mjs new-article.md`.
  const only = rawArgs.filter((a) => !a.startsWith("--"));
  const files = readdirSync(dir).filter((f) => f.endsWith(".md") && (!only.length || only.includes(f)));
  if (only.length && files.length !== only.length) {
    const missing = only.filter((f) => !files.includes(f));
    throw new Error(`Markdown file(s) not found in ${dir}: ${missing.join(", ")}`);
  }

  const now = Date.now();
  const futuristic = [];
  const noSlugMatch = [];

  for (const file of files) {
    const { meta, body, takeaways, faqs, sources } = parseArticle(readFileSync(path.join(dir, file), "utf8"));

    // A slug that does not match the filename produces a URL nobody can guess
    // and silently orphans the previous file of the same name.
    const stem = path.basename(file, ".md");
    if (meta.slug !== stem) noSlugMatch.push(`${file} -> slug "${meta.slug}"`);

    // publishedWhere() filters publishedAt <= now, so a future timestamp means
    // the row exists but every public URL 404s. This shipped once; warn loudly.
    const publishedAt = new Date(meta.publishedAt);
    if (Number.isNaN(publishedAt.getTime())) throw new Error(`${file}: publishedAt "${meta.publishedAt}" is not a date`);
    if (publishedAt.getTime() > now + 60_000) futuristic.push(`${file} (${meta.publishedAt})`);

    const category = await requireCategory(meta.category, file);
    const author = await requireAuthor(meta.author, file);

    const tagIds = [];
    for (const name of (meta.tags || "").split(",").map((t) => t.trim()).filter(Boolean)) {
      const slug = name.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
      const tag = await db.tag.upsert({ where: { slug }, update: {}, create: { slug, name } });
      tagIds.push(tag.id);
    }

    const data = {
      title: meta.title,
      type: meta.type,
      status: "PUBLISHED",
      excerpt: meta.excerpt,
      content: body,
      keyTakeaways: takeaways,
      faqs: JSON.stringify(faqs),
      sources: JSON.stringify(sources),
      coverImage: meta.coverImage || "",
      coverAlt: meta.coverAlt || "",
      coverCaption: meta.coverCaption || "",
      seoTitle: meta.seoTitle || "",
      seoDescription: meta.seoDescription || "",
      featured: meta.featured === "true",
      readingMinutes: readingMinutes(body),
      publishedAt,
      modifiedAt: meta.modifiedAt ? new Date(meta.modifiedAt) : publishedAt,
      categoryId: category.id,
      authorId: author.id,
    };

    await db.post.upsert({
      where: { slug: meta.slug },
      update: { ...data, tags: { set: tagIds.map((id) => ({ id })) } },
      create: { slug: meta.slug, ...data, tags: { connect: tagIds.map((id) => ({ id })) } },
    });
    console.log(`Seeded ${meta.type.padEnd(4)} ${meta.slug}`);
  }

  if (noSlugMatch.length) {
    console.warn(`\nWarning: slug does not match filename (URL differs from the .md name):\n  ${noSlugMatch.join("\n  ")}`);
  }
  if (futuristic.length) {
    console.warn(
      `\nWarning: publishedAt is in the future for ${futuristic.length} file(s). ` +
        `publishedWhere() filters publishedAt <= now, so these URLs will return 404 until that time passes:\n  ` +
        futuristic.join("\n  ")
    );
  }

  if (!skipRevalidate) {
    await revalidateRunningServer();
  }
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
