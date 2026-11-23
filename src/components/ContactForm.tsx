"use client";

import { useActionState } from "react";
import { sendContact, type FormState } from "@/app/(site)/actions";

export function ContactForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(sendContact, { ok: false, message: "" });

  if (state.ok) {
    return (
      <p role="status" className="rounded-md bg-emerald-50 p-4 text-emerald-800">
        {state.message}
      </p>
    );
  }

  return (
    <form action={action} className="not-prose grid gap-4 sm:grid-cols-2">
      <div aria-hidden="true" className="hidden">
        <label>
          Leave this field empty
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <div>
        <label htmlFor="name" className="label">
          Name
        </label>
        <input id="name" name="name" required minLength={2} maxLength={120} autoComplete="name" className="input" />
      </div>
      <div>
        <label htmlFor="email" className="label">
          Work email
        </label>
        <input id="email" name="email" type="email" required autoComplete="email" className="input" />
      </div>
      <div>
        <label htmlFor="company" className="label">
          Company <span className="font-normal text-muted">(optional)</span>
        </label>
        <input id="company" name="company" maxLength={160} autoComplete="organization" className="input" />
      </div>
      <div>
        <label htmlFor="subject" className="label">
          Subject
        </label>
        <select id="subject" name="subject" className="input" defaultValue="News tip">
          <option>News tip</option>
          <option>Correction request</option>
          <option>Contributor pitch</option>
          <option>Advertising and partnerships</option>
          <option>Other</option>
        </select>
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="message" className="label">
          Message
        </label>
        <textarea id="message" name="message" required minLength={20} maxLength={5000} rows={7} className="input" />
      </div>
      {state.message && (
        <p role="alert" className="text-sm text-red-600 sm:col-span-2">
          {state.message}
        </p>
      )}
      <div className="sm:col-span-2">
        <button type="submit" className="btn-primary" disabled={pending}>
          {pending ? "Sending…" : "Send message"}
        </button>
      </div>
    </form>
  );
}
