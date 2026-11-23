import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/utils";
import { deleteSubscriber } from "../../actions";

export const metadata = { title: "Subscribers" };

export default async function SubscribersAdmin() {
  const [subscribers, total] = await Promise.all([db.subscriber.findMany({ orderBy: { createdAt: "desc" }, take: 500 }), db.subscriber.count()]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-ink">
          Subscribers <span className="text-base font-normal text-muted">({total})</span>
        </h1>
        <a href="/admin/subscribers/export" className="btn-secondary">
          Export CSV
        </a>
      </div>
      <p className="mb-4 text-sm text-muted">Export the list to your email service provider (e.g. Mailchimp, Brevo, ConvertKit) to send the newsletter.</p>
      <div className="overflow-x-auto rounded-lg border border-line bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-paper text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Subscribed</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {subscribers.map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-3 font-medium text-ink">{s.email}</td>
                <td className="px-4 py-3 text-muted">{s.source}</td>
                <td className="px-4 py-3 text-muted">{formatDateTime(s.createdAt)}</td>
                <td className="px-4 py-3 text-right">
                  <form action={deleteSubscriber}>
                    <input type="hidden" name="id" value={s.id} />
                    <button type="submit" className="cursor-pointer text-red-600 hover:underline">
                      Remove
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {subscribers.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted">
                  No subscribers yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
