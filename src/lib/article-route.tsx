import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { cache } from "react";
import { ArticleView, articleBreadcrumbs } from "@/components/ArticleView";
import { JsonLd } from "@/components/JsonLd";
import { renderMarkdown } from "./markdown";
import { getAdjacentPosts, getPublishedPost, getRelatedPosts } from "./posts";
import { articleJsonLd, breadcrumbJsonLd, effectiveModifiedDate, faqJsonLd, feedAlternates, graph, ogImagePath, pageMetadata } from "./seo";
import { absoluteUrl, postPath, siteConfig } from "./site";
import { parseJsonArray, stripMarkdown, type Faq } from "./utils";

const loadPost = cache(async (slug: string, type: string) => {
  const post = await getPublishedPost(slug, type);
  if (post) return post;
  const other = await getPublishedPost(slug);
  if (other) permanentRedirect(postPath(other));
  notFound();
});

export async function articleMetadata(slug: string, type: string): Promise<Metadata> {
  const post = await loadPost(decodeURIComponent(slug), type);
  const title = post.seoTitle || post.title;
  const description = post.seoDescription || post.excerpt;
  const base = pageMetadata({ title, description, path: postPath(post), ogType: "article", image: ogImagePath(post), noindex: post.noindex });
  const modified = effectiveModifiedDate(post);
  return {
    ...base,
    alternates: {
      ...base.alternates,
      canonical: post.canonicalUrl || base.alternates?.canonical,
      types: {
        ...feedAlternates,
        "text/markdown": [{ url: absoluteUrl(`/md/${post.slug}`), title: `${post.title} (Markdown)` }],
      },
    },
    authors: [{ name: post.author.name, url: `${siteConfig.url}/author/${post.author.slug}` }],
    keywords: post.tags.map((t) => t.name),
    category: post.category.name,
    openGraph: {
      ...base.openGraph,
      type: "article",
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: modified.toISOString(),
      authors: [`${siteConfig.url}/author/${post.author.slug}`],
      section: post.category.name,
      tags: post.tags.map((t) => t.name),
    },
  };
}

export async function ArticlePage({ slug, type }: { slug: string; type: string }) {
  const post = await loadPost(decodeURIComponent(slug), type);
  const { html, toc } = renderMarkdown(post.content);
  const [related, adjacent] = await Promise.all([getRelatedPosts(post), getAdjacentPosts(post)]);
  const faqs = parseJsonArray<Faq>(post.faqs).filter((f) => f.q && f.a);
  const wordCount = stripMarkdown(post.content).split(/\s+/).filter(Boolean).length;

  const ld = graph(
    articleJsonLd(post, wordCount),
    breadcrumbJsonLd(articleBreadcrumbs(post)),
    ...(faqs.length ? [faqJsonLd(faqs)] : []),
  );

  return (
    <>
      <JsonLd data={ld} />
      <ArticleView post={post} html={html} toc={toc} related={related} adjacent={adjacent} />
    </>
  );
}
