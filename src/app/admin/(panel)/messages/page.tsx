import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/utils";
import { deleteMessage, toggleMessageRead } from "../../actions";

export const metadata = { title: "Messages" };

export default async function MessagesAdmin() {
  const messages = await db.contactMessage.findMany({ orderBy: { createdAt: "desc" }, take: 200 });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-ink">Messages</h1>
      <div className="space-y-4">
        {messages.length === 0 && <p className="text-sm text-muted">No messages yet.</p>}
        {messages.map((m) => (
          <article key={m.id} className={`rounded-lg border bg-white p-5 ${m.read ? "border-line" : "border-brand"}`}>
            <header className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className={`text-ink ${m.read ? "font-medium" : "font-semibold"}`}>{m.subject}</h2>
                <p className="text-xs text-muted">
                  {m.name} &lt;
                  <a href={`mailto:${m.email}`} className="text-brand">
                    {m.email}
                  </a>
                  &gt;{m.company && ` · ${m.company}`} · {formatDateTime(m.createdAt)}
                </p>
              </div>
              <div className="flex gap-3 text-sm">
                <form action={toggleMessageRead}>
                  <input type="hidden" name="id" value={m.id} />
                  <button type="submit" className="cursor-pointer text-brand hover:underline">
                    Mark as {m.read ? "unread" : "read"}
                  </button>
                </form>
                <form action={deleteMessage}>
                  <input type="hidden" name="id" value={m.id} />
                  <button type="submit" className="cursor-pointer text-red-600 hover:underline">
                    Delete
                  </button>
                </form>
              </div>
            </header>
            <p className="mt-3 text-sm leading-6 whitespace-pre-wrap text-steel">{m.message}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
