import { requireUser } from "@/lib/auth";
import { BACKUP_DIR, listBackups } from "@/lib/backup";
import { formatDateTime } from "@/lib/utils";
import { createServerBackup, removeServerBackup } from "../../actions";
import { RestoreForm } from "./RestoreForm";

export const metadata = { title: "Backup & restore" };

function formatSize(bytes: number) {
  return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

const kindLabel = { auto: "Scheduled", manual: "Manual", "pre-restore": "Before restore" } as const;

export default async function BackupPage() {
  const session = await requireUser();
  if (session.role !== "ADMIN") {
    return <p className="text-sm text-muted">Backup and restore are available to administrators only.</p>;
  }
  const backups = await listBackups();
  const interval = Number(process.env.BACKUP_INTERVAL_HOURS ?? 24);

  return (
    <div className="max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Backup & restore</h1>
        <p className="mt-1 text-sm text-muted">
          A backup is a single <code>.json.gz</code> file containing all articles, categories, tags, authors, media records and uploaded images, subscribers, messages and admin
          accounts. Use it to move content between sites — for example, from a local installation to induqora.com.
        </p>
      </div>

      <section className="rounded-lg border border-line bg-white p-5">
        <h2 className="font-semibold text-ink">1. Create a backup</h2>
        <p className="mt-1 mb-4 text-sm text-muted">Backup files contain subscriber emails and password hashes. Store them securely.</p>
        <div className="flex flex-wrap gap-3">
          <a href="/api/backup/download" className="btn-primary">
            Download backup now
          </a>
          <form action={createServerBackup}>
            <button type="submit" className="btn-secondary">
              Save a copy on the server
            </button>
          </form>
        </div>
      </section>

      <section className="rounded-lg border border-line bg-white p-5">
        <h2 className="font-semibold text-ink">2. Restore or import a backup</h2>
        <p className="mt-1 mb-4 text-sm text-muted">A safety backup of the current data is saved automatically before every restore.</p>
        <RestoreForm serverBackups={backups.map((b) => ({ name: b.name, label: `${kindLabel[b.kind]} — ${formatDateTime(b.createdAt)} (${formatSize(b.size)})` }))} />
      </section>

      <section className="rounded-lg border border-line bg-white">
        <div className="border-b border-line px-5 py-3">
          <h2 className="font-semibold text-ink">Backups stored on the server</h2>
          <p className="text-xs text-muted">
            {interval > 0 ? `Scheduled backup every ${interval} h, keeping the latest ${process.env.BACKUP_KEEP || 14}.` : "Scheduled backups are disabled."} Location:{" "}
            <code>{BACKUP_DIR}</code>
          </p>
        </div>
        <table className="w-full text-left text-sm">
          <tbody className="divide-y divide-line">
            {backups.map((b) => (
              <tr key={b.name}>
                <td className="px-5 py-3">
                  <p className="font-mono text-xs text-ink">{b.name}</p>
                  <p className="text-xs text-muted">
                    {kindLabel[b.kind]} · {formatDateTime(b.createdAt)}
                  </p>
                </td>
                <td className="px-5 py-3 text-muted">{formatSize(b.size)}</td>
                <td className="px-5 py-3 text-right whitespace-nowrap">
                  <a href={`/api/backup/download?name=${encodeURIComponent(b.name)}`} className="text-brand hover:underline">
                    Download
                  </a>
                  <form action={removeServerBackup} className="ml-4 inline">
                    <input type="hidden" name="name" value={b.name} />
                    <button type="submit" className="cursor-pointer text-red-600 hover:underline">
                      Delete
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {backups.length === 0 && (
              <tr>
                <td className="px-5 py-8 text-center text-muted">No backups stored on the server yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
