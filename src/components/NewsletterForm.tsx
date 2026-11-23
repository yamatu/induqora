"use client";

import { useActionState } from "react";
import { subscribe, type FormState } from "@/app/(site)/actions";

export function NewsletterForm({ source, dark = false }: { source: string; dark?: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(subscribe, { ok: false, message: "" });

  if (state.ok) {
    return (
      <p role="status" className={dark ? "text-sm text-emerald-300" : "text-sm text-emerald-700"}>
        {state.message}
      </p>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
      <input type="hidden" name="source" value={source} />
      <div aria-hidden="true" className="hidden">
        <label>
          Leave this field empty
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <label htmlFor={`newsletter-${source}`} className="sr-only">
        Email address
      </label>
      <input
        id={`newsletter-${source}`}
        name="email"
        type="email"
        required
        autoComplete="email"
        placeholder="you@company.com"
        className="input flex-1"
      />
      <button type="submit" className="btn-primary" disabled={pending}>
        {pending ? "Subscribing…" : "Subscribe"}
      </button>
      {state.message && (
        <p role="alert" className="text-sm text-red-500 sm:basis-full">
          {state.message}
        </p>
      )}
    </form>
  );
}
