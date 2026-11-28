import { Marked, type Tokens } from "marked";
import sanitizeHtml from "sanitize-html";
import { mediaDimensions } from "./media";
import { siteConfig } from "./site";
import { slugify } from "./utils";

export type TocItem = { id: string; text: string; depth: number };

type RendererThis = { parser: { parseInline: (tokens: Tokens.Generic[]) => string } };

const allowedTags = [
  ...sanitizeHtml.defaults.allowedTags,
  "img",
  "figure",
  "figcaption",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "del",
  "sup",
  "sub",
  "details",
  "summary",
];

const siteHost = new URL(siteConfig.url).host;

/**
 * Supplier / vendor domains we link to commercially. Links to them stay nofollow: they are
 * promotional references, not independent editorial citations, so they must not pass ranking
 * signals. Add a domain here instead of hand-editing article markdown.
 */
const COMMERCIAL_HOSTS = ["vibocnc.com", "vcocncspare.com"];

function attr(value: string) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function plainText(html: string) {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function isExternal(href: string) {
  try {
    const u = new URL(href);
    return /^https?:$/.test(u.protocol) && u.host !== siteHost;
  } catch {
    return false;
  }
}

function isCommercial(href: string) {
  try {
    const host = new URL(href).host.replace(/^www\./i, "").toLowerCase();
    return COMMERCIAL_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
  } catch {
    return false;
  }
}

/** True when the article body promotes a listed commercial partner (used for disclosure). */
export function hasCommercialLinks(markdown: string) {
  return [...markdown.matchAll(/\]\((https?:\/\/[^)\s]+)/g)].some((m) => isCommercial(m[1]));
}

export function renderMarkdown(markdown: string): { html: string; toc: TocItem[] } {
  const toc: TocItem[] = [];
  const used = new Map<string, number>();

  const marked = new Marked({ gfm: true });
  marked.use({
    renderer: {
      heading(this: RendererThis, { tokens, depth }: Tokens.Heading) {
        const inner = this.parser.parseInline(tokens);
        const text = plainText(inner);
        let id = slugify(text) || "section";
        const n = used.get(id) ?? 0;
        used.set(id, n + 1);
        if (n > 0) id = `${id}-${n}`;
        if (depth === 2 || depth === 3) toc.push({ id, text, depth });
        return `<h${depth} id="${id}">${inner}</h${depth}>\n`;
      },
      link(this: RendererThis, { href, title, tokens }: Tokens.Link) {
        const text = this.parser.parseInline(tokens);
        const t = title ? ` title="${attr(title)}"` : "";
        const rel = isExternal(href)
          ? ` rel="${isCommercial(href) ? "nofollow noopener" : "noopener"}" target="_blank"`
          : "";
        return `<a href="${attr(href)}"${t}${rel}>${text}</a>`;
      },
      image({ href, title, text }: Tokens.Image) {
        const caption = title ? `<figcaption>${attr(title)}</figcaption>` : "";
        const dims = mediaDimensions(href);
        const size = dims ? ` width="${dims.width}" height="${dims.height}"` : "";
        return `<figure><img src="${attr(href)}" alt="${attr(text)}" loading="lazy" decoding="async"${size} />${caption}</figure>`;
      },
      table(this: RendererThis, token: Tokens.Table) {
        const head = token.header.map((c) => `<th>${this.parser.parseInline(c.tokens)}</th>`).join("");
        const body = token.rows
          .map((row) => `<tr>${row.map((c) => `<td>${this.parser.parseInline(c.tokens)}</td>`).join("")}</tr>`)
          .join("");
        return `<div class="table-wrap"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>\n`;
      },
    },
  });

  const raw = marked.parse(markdown, { async: false }) as string;

  const html = sanitizeHtml(raw, {
    allowedTags,
    allowedAttributes: {
      a: ["href", "title", "rel", "target"],
      img: ["src", "alt", "title", "loading", "decoding", "width", "height"],
      h1: ["id"],
      h2: ["id"],
      h3: ["id"],
      h4: ["id"],
      h5: ["id"],
      h6: ["id"],
      div: ["class"],
      code: ["class"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesByTag: { img: ["http", "https"] },
    allowProtocolRelative: false,
  });

  return { html, toc };
}
