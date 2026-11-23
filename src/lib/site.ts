export const siteConfig = {
  name: "Induqora",
  domain: "induqora.com",
  url: (process.env.SITE_URL || "https://induqora.com").replace(/\/$/, ""),
  tagline: "Industrial Automation & Control, Explained",
  description:
    "Induqora covers industrial automation and control: PLCs, DCS, SCADA, industrial networking, OT cybersecurity, motion control, robotics and IIoT — with news, technical guides and engineering analysis.",
  locale: "en_US",
  language: "en-US",
  contactEmail: "editorial@induqora.com",
  foundingYear: 2026,
  social: {
    linkedin: "",
    x: "",
  },
  mainNav: [
    { href: "/news", label: "News" },
    { href: "/blog", label: "Insights" },
    { href: "/topics", label: "Topics" },
    { href: "/about", label: "About" },
  ],
  footerNav: [
    { href: "/about", label: "About Induqora" },
    { href: "/editorial-policy", label: "Editorial Policy" },
    { href: "/authors", label: "Authors" },
    { href: "/contact", label: "Contact" },
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms of Use" },
  ],
} as const;

export const POSTS_PER_PAGE = 12;

export const POST_TYPES = {
  NEWS: { label: "News", path: "/news", schemaType: "NewsArticle" },
  BLOG: { label: "Insights", path: "/blog", schemaType: "BlogPosting" },
} as const;

export type PostType = keyof typeof POST_TYPES;

export function postPath(post: { type: string; slug: string }) {
  const t = POST_TYPES[post.type as PostType] ?? POST_TYPES.BLOG;
  return `${t.path}/${post.slug}`;
}

export function absoluteUrl(path = "/") {
  if (/^https?:\/\//.test(path)) return path;
  return `${siteConfig.url}${path.startsWith("/") ? path : `/${path}`}`;
}
