import type { Metadata } from "next";
import type { Author, Category, Post, Tag } from "@prisma/client";
import { POST_TYPES, absoluteUrl, postPath, siteConfig, type PostType } from "./site";
import { parseJsonArray, parseLines, type Faq, type Source } from "./utils";

type PageMetaInput = {
  title: string;
  description: string;
  path: string;
  noindex?: boolean;
  ogType?: "website" | "article" | "profile";
  image?: string;
  absoluteTitle?: boolean;
};

/** Google truncates titles around 60 characters / 580px. */
const TITLE_MAX = 60;

export const feedAlternates = {
  "application/rss+xml": [{ url: "/rss.xml", title: `${siteConfig.name} — All stories` }],
  "application/feed+json": [{ url: "/feed.json", title: `${siteConfig.name} — JSON Feed` }],
  "text/plain": [{ url: "/llms.txt", title: `${siteConfig.name} — LLMs.txt` }],
};

function imageDimensions(image: string) {
  return image.startsWith("/media/") ? { width: 1200, height: 675 } : { width: 1200, height: 630 };
}

export function pageMetadata({ title, description, path, noindex, ogType = "website", image = "/og/default", absoluteTitle }: PageMetaInput): Metadata {
  const url = absoluteUrl(path);
  const fullTitle = absoluteTitle ? title : `${title} | ${siteConfig.name}`;
  // Drop the "| Induqora" suffix whenever it would push an otherwise fine title past the SERP cut-off.
  const dropSuffix = !absoluteTitle && fullTitle.length > TITLE_MAX;
  const imageUrl = image ? absoluteUrl(image) : "";
  const dims = imageDimensions(image);
  return {
    title: absoluteTitle || dropSuffix ? { absolute: title } : title,
    description,
    alternates: { canonical: url, types: feedAlternates },
    robots: noindex ? { index: false, follow: true } : undefined,
    openGraph: {
      type: ogType,
      url,
      title: fullTitle,
      description,
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      ...(imageUrl ? { images: [{ url: imageUrl, width: dims.width, height: dims.height, alt: fullTitle }] } : {}),
    },
    twitter: { card: "summary_large_image", title: fullTitle, description, ...(imageUrl ? { images: [imageUrl] } : {}) },
  };
}

export function ogImagePath(post: { slug: string; coverImage: string }) {
  return post.coverImage || `/og/${post.slug}`;
}

export const organizationId = `${siteConfig.url}/#organization`;
export const websiteId = `${siteConfig.url}/#website`;

export function organizationJsonLd() {
  const sameAs = Object.values(siteConfig.social).filter(Boolean);
  return {
    "@type": "NewsMediaOrganization",
    "@id": organizationId,
    name: siteConfig.name,
    url: siteConfig.url,
    logo: { "@type": "ImageObject", url: absoluteUrl("/logo.png"), width: 512, height: 512 },
    description: siteConfig.description,
    foundingDate: String(siteConfig.foundingYear),
    email: siteConfig.contactEmail,
    publishingPrinciples: absoluteUrl("/editorial-policy"),
    correctionsPolicy: absoluteUrl("/editorial-policy#corrections"),
    ethicsPolicy: absoluteUrl("/editorial-policy#independence"),
    actionableFeedbackPolicy: absoluteUrl("/contact"),
    knowsAbout: [
      "Industrial automation",
      "Programmable logic controllers",
      "Distributed control systems",
      "SCADA",
      "Industrial networking",
      "OT cybersecurity",
      "Motion control",
      "Industrial robotics",
      "Industrial IoT",
      "Smart manufacturing",
      "Functional safety",
    ],
    ...(sameAs.length ? { sameAs } : {}),
  };
}

export function websiteJsonLd() {
  return {
    "@type": "WebSite",
    "@id": websiteId,
    url: siteConfig.url,
    name: siteConfig.name,
    description: siteConfig.description,
    inLanguage: siteConfig.language,
    publisher: { "@id": organizationId },
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${siteConfig.url}/search?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function personJsonLd(author: Author) {
  const sameAs = [author.linkedinUrl, author.xUrl, author.websiteUrl].filter(Boolean);
  const expertise = author.expertise.split(",").map((s) => s.trim()).filter(Boolean);
  return {
    "@type": "Person",
    "@id": absoluteUrl(`/author/${author.slug}#person`),
    name: author.name,
    url: absoluteUrl(`/author/${author.slug}`),
    ...(author.jobTitle ? { jobTitle: author.jobTitle } : {}),
    ...(author.bio ? { description: author.bio } : {}),
    ...(author.avatarUrl ? { image: absoluteUrl(author.avatarUrl) } : {}),
    ...(expertise.length ? { knowsAbout: expertise } : {}),
    ...(sameAs.length ? { sameAs } : {}),
    worksFor: { "@id": organizationId },
  };
}

type FullPost = Post & { author: Author; category: Category; tags: Tag[] };

export function effectiveModifiedDate(post: { publishedAt: Date | null; modifiedAt: Date }) {
  return post.publishedAt && post.modifiedAt < post.publishedAt ? post.publishedAt : post.modifiedAt;
}

export function articleJsonLd(post: FullPost, wordCount: number) {
  const url = absoluteUrl(postPath(post));
  const schemaType = POST_TYPES[post.type as PostType]?.schemaType ?? "Article";
  const takeaways = parseLines(post.keyTakeaways);
  const sources = parseJsonArray<Source>(post.sources);
  const modified = effectiveModifiedDate(post);
  const imgPath = ogImagePath(post);
  const imageUrl = absoluteUrl(imgPath);
  const dims = imageDimensions(imgPath);
  return {
    "@type": schemaType,
    "@id": `${url}#article`,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
    headline: post.title.slice(0, 110),
    description: post.seoDescription || post.excerpt,
    ...(takeaways.length ? { abstract: takeaways.join(" ") } : {}),
    image: [{ "@type": "ImageObject", url: imageUrl, width: dims.width, height: dims.height }],
    datePublished: post.publishedAt?.toISOString(),
    dateModified: modified.toISOString(),
    author: [personJsonLd(post.author)],
    publisher: { "@id": organizationId },
    isPartOf: { "@id": websiteId },
    articleSection: post.category.name,
    keywords: post.tags.map((t) => t.name).join(", "),
    about: post.tags.map((t) => ({ "@type": "Thing", name: t.name })),
    inLanguage: siteConfig.language,
    wordCount,
    ...(post.readingMinutes > 0 ? { timeRequired: `PT${post.readingMinutes}M` } : {}),
    isAccessibleForFree: true,
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: ["h1", ".article-excerpt", "#key-takeaways"],
    },
    ...(sources.length
      ? { citation: sources.map((s) => ({ "@type": "CreativeWork", name: s.title, ...(s.url ? { url: s.url } : {}) })) }
      : {}),
  };
}

export function faqJsonLd(faqs: Faq[]) {
  return {
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

export function collectionJsonLd(opts: { name: string; description: string; path: string; items: { type: string; slug: string; title: string }[] }) {
  return {
    "@type": "CollectionPage",
    "@id": `${absoluteUrl(opts.path)}#page`,
    url: absoluteUrl(opts.path),
    name: opts.name,
    description: opts.description,
    isPartOf: { "@id": websiteId },
    inLanguage: siteConfig.language,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: opts.items.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: absoluteUrl(postPath(p)),
        name: p.title,
      })),
    },
  };
}

export function linkListCollectionJsonLd(opts: { name: string; description: string; path: string; items: { path: string; name: string; description?: string }[] }) {
  return {
    "@type": "CollectionPage",
    "@id": `${absoluteUrl(opts.path)}#page`,
    url: absoluteUrl(opts.path),
    name: opts.name,
    description: opts.description,
    isPartOf: { "@id": websiteId },
    inLanguage: siteConfig.language,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: opts.items.map((item, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: absoluteUrl(item.path),
        name: item.name,
        ...(item.description ? { description: item.description } : {}),
      })),
    },
  };
}

export function graph(...nodes: object[]) {
  return { "@context": "https://schema.org", "@graph": nodes };
}
