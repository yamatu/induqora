import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { Pagination } from "@/components/Pagination";
import { PostGrid } from "@/components/PostCard";
import { db } from "@/lib/db";
import { listPosts } from "@/lib/posts";
import { breadcrumbJsonLd, graph, pageMetadata, personJsonLd } from "@/lib/seo";
import { absoluteUrl } from "@/lib/site";
import { clampPage } from "@/lib/utils";

export const revalidate = 300;

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> };

const getAuthor = cache(async (slug: string) => {
  const author = await db.author.findUnique({ where: { slug } });
  if (!author) notFound();
  return author;
});

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const author = await getAuthor((await params).slug);
  const page = clampPage((await searchParams).page);
  const path = `/author/${author.slug}`;
  return pageMetadata({
    title: `${author.name}${author.jobTitle ? `, ${author.jobTitle}` : ""}`,
    description: author.bio || `Articles by ${author.name} on Induqora.`,
    path: page > 1 ? `${path}?page=${page}` : path,
    ogType: "profile",
    image: author.avatarUrl || undefined,
  });
}

export default async function AuthorPage({ params, searchParams }: Props) {
  const author = await getAuthor((await params).slug);
  const page = clampPage((await searchParams).page);
  const { posts, total, totalPages } = await listPosts({ authorId: author.id }, page);
  if (page > totalPages) notFound();

  const path = `/author/${author.slug}`;
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Authors", path: "/authors" },
    { name: author.name, path },
  ];
  const expertise = author.expertise.split(",").map((s) => s.trim()).filter(Boolean);
  const links = [
    { label: "LinkedIn", url: author.linkedinUrl },
    { label: "X", url: author.xUrl },
    { label: "Website", url: author.websiteUrl },
  ].filter((l) => l.url);

  const profilePage = {
    "@type": "ProfilePage",
    "@id": `${absoluteUrl(path)}#page`,
    url: absoluteUrl(path),
    name: author.name,
    mainEntity: personJsonLd(author),
  };

  return (
    <div className="container-page pt-8">
      <JsonLd data={graph(profilePage, breadcrumbJsonLd(crumbs))} />
      <Breadcrumbs items={crumbs} />
      <header className="mt-6 mb-12 flex max-w-3xl flex-col gap-6 sm:flex-row">
        {author.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={author.avatarUrl} alt={author.name} width={112} height={112} className="h-28 w-28 shrink-0 rounded-full object-cover" />
        ) : (
          <span aria-hidden="true" className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full bg-brand/10 text-4xl font-semibold text-brand">
            {author.name.charAt(0)}
          </span>
        )}
        <div>
          <h1 className="font-serif text-3xl font-bold text-ink">{author.name}</h1>
          {author.jobTitle && <p className="mt-1 text-steel">{author.jobTitle}</p>}
          {author.bio && <p className="mt-4 leading-7 text-steel">{author.bio}</p>}
          {expertise.length > 0 && (
            <p className="mt-4 text-sm text-muted">
              <span className="font-semibold text-steel">Covers:</span> {expertise.join(" · ")}
            </p>
          )}
          {links.length > 0 && (
            <p className="mt-3 flex gap-3 text-sm">
              {links.map((l) => (
                <a key={l.label} href={l.url} rel="me noopener" target="_blank" className="text-brand hover:underline">
                  {l.label}
                </a>
              ))}
            </p>
          )}
        </div>
      </header>
      <h2 className="mb-8 border-b-2 border-ink pb-3 text-xl font-bold text-ink">
        Articles by {author.name} <span className="font-normal text-muted">({total})</span>
      </h2>
      <PostGrid posts={posts} />
      <Pagination basePath={path} page={page} totalPages={totalPages} />
    </div>
  );
}
