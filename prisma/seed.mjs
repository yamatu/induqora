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
    slug: "edword",
    name: "Edword",
    jobTitle: "Editor, Induqora",
    bio: "Edword writes and edits Induqora's coverage of industrial automation and control, including PLC programming, industrial networking, OT cybersecurity, process control and the regulation that shapes the automation industry.",
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
  // Optional CLI args limit the import to specific files, e.g. `node prisma/seed.mjs new-article.md`.
  const only = process.argv.slice(2);
  const files = readdirSync(dir).filter((f) => f.endsWith(".md") && (!only.length || only.includes(f)));
  for (const file of files) {
    const { meta, body, takeaways, faqs, sources } = parseArticle(readFileSync(path.join(dir, file), "utf8"));
    const category = await db.category.findUniqueOrThrow({ where: { slug: meta.category } });
    const author = await db.author.findUniqueOrThrow({ where: { slug: meta.author } });

    const tagIds = [];
    for (const name of (meta.tags || "").split(",").map((t) => t.trim()).filter(Boolean)) {
      const slug = name.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
      const tag = await db.tag.upsert({ where: { slug }, update: {}, create: { slug, name } });
      tagIds.push(tag.id);
    }

    const publishedAt = new Date(meta.publishedAt);
    const data = {
      title: meta.title,
      type: meta.type,
      status: "PUBLISHED",
      excerpt: meta.excerpt,
      content: body,
      keyTakeaways: takeaways,
      faqs: JSON.stringify(faqs),
      sources: JSON.stringify(sources),
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
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
