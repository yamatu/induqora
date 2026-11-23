import type { Metadata } from "next";
import Link from "next/link";
import { LogoMark } from "@/components/Logo";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { logout } from "../actions";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s — Induqora Admin" },
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireUser();
  const unread = await db.contactMessage.count({ where: { read: false } });

  const nav = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/posts", label: "Articles" },
    { href: "/admin/posts/new", label: "New article" },
    { href: "/admin/categories", label: "Categories" },
    { href: "/admin/tags", label: "Tags" },
    { href: "/admin/authors", label: "Authors" },
    { href: "/admin/media", label: "Media library" },
    { href: "/admin/subscribers", label: "Subscribers" },
    { href: "/admin/messages", label: `Messages${unread ? ` (${unread})` : ""}` },
    { href: "/admin/users", label: "Users & security" },
    { href: "/admin/backup", label: "Backup & restore" },
  ];

  return (
    <div className="flex min-h-screen bg-paper">
      <aside className="hidden w-60 shrink-0 flex-col bg-ink text-slate-300 md:flex">
        <Link href="/admin" className="flex items-center gap-2 px-5 py-5 text-white">
          <LogoMark className="h-7 w-7" />
          <span className="font-bold">Induqora Admin</span>
        </Link>
        <nav aria-label="Admin" className="flex-1 space-y-0.5 px-3">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="block rounded-md px-3 py-2 text-sm hover:bg-slate-800 hover:text-white">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-slate-800 p-4 text-xs">
          <p className="text-white">{session.name}</p>
          <p className="text-slate-500">
            {session.email} · {session.role}
          </p>
          <div className="mt-3 flex gap-3">
            <Link href="/" target="_blank" className="hover:text-white">
              View site ↗
            </Link>
            <form action={logout}>
              <button type="submit" className="cursor-pointer hover:text-white">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-line bg-white px-4 py-3 md:hidden">
          <span className="font-bold">Induqora Admin</span>
          <details className="relative">
            <summary className="list-none rounded border border-line px-3 py-1 text-sm">Menu</summary>
            <nav className="absolute right-0 z-10 mt-2 w-56 rounded-lg border border-line bg-white p-2 shadow-lg">
              {nav.map((item) => (
                <Link key={item.href} href={item.href} className="block rounded px-3 py-2 text-sm hover:bg-paper">
                  {item.label}
                </Link>
              ))}
              <form action={logout}>
                <button type="submit" className="w-full rounded px-3 py-2 text-left text-sm hover:bg-paper">
                  Sign out
                </button>
              </form>
            </nav>
          </details>
        </header>
        <main className="flex-1 p-4 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
