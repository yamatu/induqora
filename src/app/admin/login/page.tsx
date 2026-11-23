import type { Metadata } from "next";
import { Logo } from "@/components/Logo";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Sign in — Induqora Admin", robots: { index: false, follow: false } };

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm rounded-xl border border-line bg-white p-8 shadow-sm">
        <Logo />
        <h1 className="mt-6 text-xl font-semibold text-ink">Sign in to the newsroom</h1>
        <p className="mt-1 text-sm text-muted">Editors and administrators only.</p>
        <LoginForm />
      </div>
    </div>
  );
}
