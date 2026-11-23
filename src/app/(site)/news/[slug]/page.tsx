import { ArticlePage, articleMetadata } from "@/lib/article-route";

export const revalidate = 300;

export function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  return articleMetadata((await params).slug, "NEWS");
}

export default async function Page({ params }: Props) {
  return <ArticlePage slug={(await params).slug} type="NEWS" />;
}
