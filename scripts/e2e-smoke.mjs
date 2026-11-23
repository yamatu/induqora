// Submits forms the way a no-JS browser does (progressive enhancement) to exercise server actions.
// Usage: node --env-file=.env scripts/e2e-smoke.mjs [baseUrl]
const BASE = process.argv[2] || "http://localhost:3000";
let cookie = "";

function hiddenFields(html, marker) {
  const start = marker ? html.indexOf(marker) : 0;
  const formStart = html.lastIndexOf("<form", start);
  const formEnd = html.indexOf("</form>", start);
  const form = html.slice(formStart, formEnd);
  const fd = new FormData();
  for (const m of form.matchAll(/<input[^>]*type="hidden"[^>]*>/g)) {
    const name = m[0].match(/name="([^"]*)"/)?.[1];
    const value = m[0].match(/value="([^"]*)"/)?.[1] ?? "";
    if (name) fd.append(name, value.replace(/&quot;/g, '"').replace(/&amp;/g, "&"));
  }
  return fd;
}

async function get(path) {
  const res = await fetch(BASE + path, { headers: { cookie }, redirect: "manual" });
  return { status: res.status, html: await res.text(), location: res.headers.get("location") };
}

async function submit(path, marker, fields) {
  const { html } = await get(path);
  const fd = hiddenFields(html, marker);
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  const res = await fetch(BASE + path, { method: "POST", body: fd, headers: { cookie, origin: BASE }, redirect: "manual" });
  const setCookie = res.headers.get("set-cookie");
  if (setCookie) cookie = setCookie.split(";")[0];
  return { status: res.status, location: res.headers.get("location"), html: await res.text() };
}

function check(label, ok, extra = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${extra ? `  (${extra})` : ""}`);
  if (!ok) process.exitCode = 1;
}

const bad = await submit("/admin/login", 'name="password"', { email: process.env.ADMIN_EMAIL, password: "wrong-password" });
check("login rejects bad password", bad.html.includes("Invalid email or password"));

const login = await submit("/admin/login", 'name="password"', { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD });
check("login succeeds and sets session cookie", cookie.startsWith("iq_session="), `status ${login.status}`);

for (const p of ["/admin", "/admin/posts", "/admin/posts/new", "/admin/categories", "/admin/tags", "/admin/authors", "/admin/media", "/admin/subscribers", "/admin/messages", "/admin/users", "/admin/subscribers/export"]) {
  const r = await get(p);
  check(`GET ${p}`, r.status === 200, String(r.status));
}

const newPage = await get("/admin/posts/new");
const catId = newPage.html.match(/<select[^>]*name="categoryId"[\s\S]*?<option value="([^"]+)"/)?.[1] ?? newPage.html.match(/name="categoryId"[\s\S]*?value="(c[a-z0-9]+)"/)?.[1];
const authorId = newPage.html.match(/name="authorId"[\s\S]*?value="(c[a-z0-9]+)"/)?.[1];
const slug = `e2e-test-article-${Date.now()}`;
const create = await submit("/admin/posts/new", 'name="title"', {
  title: "End-to-end test article about Modbus TCP diagnostics",
  slug,
  type: "NEWS",
  status: "PUBLISHED",
  excerpt: "This is an automated end-to-end test article used to verify that the editor, publishing and rendering pipeline works correctly.",
  content: "## First section\n\nSome **bold** text and a [link](https://example.com).\n\n## Second section\n\n| A | B |\n|---|---|\n| 1 | 2 |\n\n<script>alert(1)</script>",
  categoryId: catId,
  authorId,
  tags: "Modbus TCP, E2E Test",
  keyTakeaways: "Line one.\nLine two.",
  faqs: "Q: Does it work?\nA: Yes, it works.",
  sources: "Example source | https://example.com",
  publishedAt: "",
  seoTitle: "",
  seoDescription: "",
  canonicalUrl: "",
  coverImage: "",
  coverAlt: "",
  coverCaption: "",
});
check("create article redirects to editor", create.status === 303 && /\/admin\/posts\/c/.test(create.location ?? ""), `${create.status} ${create.location}`);

const live = await get(`/news/${slug}`);
check("published article renders", live.status === 200 && live.html.includes("End-to-end test article"), String(live.status));
check("script tags are sanitized", !live.html.includes("<script>alert(1)</script>"));
check("FAQ JSON-LD present", live.html.includes('"FAQPage"'));
check("table rendered", live.html.includes("table-wrap"));

const id = create.location?.split("/").pop()?.split("?")[0];
const del = await submit(`/admin/posts/${id}`, "Permanently delete", {});
check("delete article", del.status === 303, String(del.status));
const gone = await get(`/news/${slug}`);
check("deleted article returns 404", gone.status === 404, String(gone.status));

const png = new Blob([await (await fetch(`${BASE}/logo.png`)).arrayBuffer()], { type: "image/png" });
const mediaPage = await get("/admin/media");
const mfd = hiddenFields(mediaPage.html, 'name="file"');
mfd.set("file", png, "E2E Test Image.png");
mfd.set("alt", "e2e test image");
await fetch(`${BASE}/admin/media`, { method: "POST", body: mfd, headers: { cookie, origin: BASE }, redirect: "manual" });
const afterUpload = await get("/admin/media");
const mediaUrl = afterUpload.html.match(/\/media\/\d{4}\/\d{2}\/e2e-test-image-[a-f0-9]+\.png/)?.[0];
check("media upload", Boolean(mediaUrl), mediaUrl);
if (mediaUrl) {
  const served = await fetch(BASE + mediaUrl);
  check("uploaded media is served", served.status === 200 && served.headers.get("content-type") === "image/png", String(served.status));
  const traversal = await fetch(`${BASE}/media/..%2F..%2F.env`);
  check("media path traversal blocked", traversal.status === 404, String(traversal.status));
  const page = afterUpload.html;
  const deleteFormStart = page.indexOf("<form", page.indexOf(`value="${mediaUrl}"`));
  const dfd = hiddenFields(page, page.slice(deleteFormStart, deleteFormStart + 2000).match(/name="id" value="[^"]+"/)[0]);
  await fetch(`${BASE}/admin/media`, { method: "POST", body: dfd, headers: { cookie, origin: BASE }, redirect: "manual" });
  const afterDelete = await get("/admin/media");
  check("media delete", !afterDelete.html.includes(mediaUrl));
}

cookie = "";
const sub = await submit("/", 'name="email"', { email: `e2e-${Date.now()}@example.com` });
check("newsletter subscribe", sub.status === 200 && sub.html.includes("subscribed"), String(sub.status));
const contact = await submit("/contact", 'name="message"', {
  name: "E2E Tester",
  email: "e2e@example.com",
  company: "",
  subject: "Other",
  message: "This is an automated test message from the e2e smoke test.",
});
check("contact form", contact.status === 200 && contact.html.includes("message has been sent"), String(contact.status));
