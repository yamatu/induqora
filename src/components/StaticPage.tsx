import { breadcrumbJsonLd, graph, websiteId } from "@/lib/seo";
import { absoluteUrl, siteConfig } from "@/lib/site";
import { formatDate } from "@/lib/utils";
import { Breadcrumbs } from "./Breadcrumbs";
import { JsonLd } from "./JsonLd";

export function StaticPage({
  title,
  intro,
  path,
  schemaType = "WebPage",
  lastUpdated,
  children,
}: {
  title: string;
  intro?: string;
  path: string;
  schemaType?: "WebPage" | "AboutPage" | "ContactPage";
  lastUpdated?: string;
  children: React.ReactNode;
}) {
  const crumbs = [
    { name: "Home", path: "/" },
    { name: title, path },
  ];
  return (
    <div className="container-page pt-8">
      <JsonLd
        data={graph(
          {
            "@type": schemaType,
            "@id": `${absoluteUrl(path)}#page`,
            url: absoluteUrl(path),
            name: title,
            ...(intro ? { description: intro } : {}),
            isPartOf: { "@id": websiteId },
            inLanguage: siteConfig.language,
          },
          breadcrumbJsonLd(crumbs),
        )}
      />
      <div className="mx-auto max-w-3xl">
        <Breadcrumbs items={crumbs} />
        <h1 className="mt-6 font-serif text-3xl font-bold text-ink sm:text-4xl">{title}</h1>
        {intro && <p className="mt-4 text-lg leading-8 text-steel">{intro}</p>}
        {lastUpdated && <p className="mt-2 text-sm text-muted">Last updated: {formatDate(lastUpdated)}</p>}
        <div className="article-body prose prose-lg prose-slate mt-8 max-w-none prose-a:text-brand">{children}</div>
      </div>
    </div>
  );
}
