"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { db } from "@/lib/db";

export type FormState = { ok: boolean; message: string };

const hits = new Map<string, number[]>();

async function rateLimited(bucket: string, limit: number, windowMs: number) {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  const key = `${bucket}:${ip}`;
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 10_000) hits.clear();
  return recent.length > limit;
}

const emailSchema = z.string().trim().toLowerCase().email("Please enter a valid email address.").max(254);

export async function subscribe(_prev: FormState, formData: FormData): Promise<FormState> {
  if (formData.get("website")) return { ok: true, message: "Thanks — you're subscribed." };
  if (await rateLimited("subscribe", 5, 60 * 60 * 1000)) {
    return { ok: false, message: "Too many attempts. Please try again later." };
  }

  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { ok: false, message: "Please enter a valid email address." };

  const source = String(formData.get("source") || "").slice(0, 64);
  await db.subscriber.upsert({
    where: { email: parsed.data },
    update: {},
    create: { email: parsed.data, source },
  });
  return { ok: true, message: "Thanks — you're subscribed to the Induqora briefing." };
}

const contactSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name.").max(120),
  email: emailSchema,
  company: z.string().trim().max(160).optional().default(""),
  subject: z.string().trim().min(3, "Please add a subject.").max(200),
  message: z.string().trim().min(20, "Your message should be at least 20 characters.").max(5000),
});

export async function sendContact(_prev: FormState, formData: FormData): Promise<FormState> {
  if (formData.get("website")) return { ok: true, message: "Thanks — your message has been sent." };
  if (await rateLimited("contact", 5, 60 * 60 * 1000)) {
    return { ok: false, message: "Too many messages. Please try again later." };
  }

  const parsed = contactSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Please check the form and try again." };
  }

  await db.contactMessage.create({ data: parsed.data });
  return { ok: true, message: "Thanks — your message has been sent. Our editors usually reply within two business days." };
}
