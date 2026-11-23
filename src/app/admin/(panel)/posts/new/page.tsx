import Link from "next/link";
import { siteConfig } from "@/lib/site";
import { PostForm } from "../PostForm";
import { formOptions, toFormValues } from "../form-data";

export const metadata = { title: "New article" };

export default async function NewPostPage() {
  const { categories, authors } = await formOptions();
  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin/posts" className="text-sm text-muted hover:text-brand">
          ← Articles
        </Link>
        <h1 className="text-2xl font-semibold text-ink">New article</h1>
      </div>
      <PostForm initial={toFormValues(null, { categoryId: categories[0]?.id, authorId: authors[0]?.id })} categories={categories} authors={authors} siteUrl={siteConfig.url} />
    </div>
  );
}
