// Waits for the server, purges pages prerendered at build time, then re-renders key URLs.
const base = `http://127.0.0.1:${process.env.PORT || 3000}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let ok = false;
for (let i = 0; i < 120 && !ok; i++) {
  try {
    const res = await fetch(`${base}/api/revalidate`, {
      method: "POST",
      headers: { "x-revalidate-secret": process.env.AUTH_SECRET ?? "" },
    });
    ok = res.ok;
    if (!ok && res.status === 401) break;
  } catch {
    // server not listening yet
  }
  if (!ok) await sleep(1000);
}

if (!ok) {
  console.error("[induqora] warmup: cache revalidation failed");
  process.exit(0);
}

const paths = ["/", "/news", "/blog", "/topics", "/authors", "/about", "/editorial-policy", "/contact", "/privacy", "/terms", "/sitemap.xml", "/news-sitemap.xml", "/rss.xml", "/feed.json", "/llms.txt", "/llms-full.txt"];
for (const p of paths) {
  await fetch(base + p).catch(() => undefined);
}
console.log("[induqora] warmup: caches refreshed");
