"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Result = {
  ok: boolean;
  message?: string;
  mode?: string;
  safetyBackup?: string;
  source?: string;
  backupCreatedAt?: string;
  result?: Record<string, number>;
};

export function RestoreForm({ serverBackups }: { serverBackups: { name: string; label: string }[] }) {
  const router = useRouter();
  const [source, setSource] = useState<"upload" | "server">("upload");
  const [mode, setMode] = useState<"merge" | "replace">("merge");
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (source === "upload" && !(fd.get("file") instanceof File && (fd.get("file") as File).size > 0)) {
      setResult({ ok: false, message: "Choose a backup file to upload." });
      return;
    }
    if (source === "upload") fd.delete("name");
    else fd.delete("file");
    const warning =
      mode === "replace"
        ? "REPLACE mode deletes all current articles, categories, tags, authors and media records before restoring. Continue?"
        : "Merge this backup into the current site? Items with the same slug will be overwritten.";
    if (!window.confirm(warning)) return;

    setPending(true);
    setResult(null);
    try {
      const res = await fetch("/api/backup/restore", { method: "POST", body: fd });
      setResult(await res.json().catch(() => ({ ok: false, message: `Restore failed (HTTP ${res.status}).` })));
      if (res.ok) router.refresh();
    } catch {
      setResult({ ok: false, message: "Network error — the upload did not complete." });
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <fieldset className="space-y-2 text-sm">
        <legend className="label">Source</legend>
        <label className="flex items-center gap-2">
          <input type="radio" checked={source === "upload"} onChange={() => setSource("upload")} /> Upload a backup file from my computer
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" checked={source === "server"} onChange={() => setSource("server")} disabled={!serverBackups.length} /> Use a backup stored on the server
        </label>
      </fieldset>

      {source === "upload" ? (
        <input name="file" type="file" accept=".gz,.json,application/gzip,application/json" className="block text-sm" />
      ) : (
        <select name="name" className="input max-w-xl">
          {serverBackups.map((b) => (
            <option key={b.name} value={b.name}>
              {b.label}
            </option>
          ))}
        </select>
      )}

      <fieldset className="space-y-2 text-sm">
        <legend className="label">Mode</legend>
        <label className="flex items-start gap-2">
          <input type="radio" name="mode" value="merge" checked={mode === "merge"} onChange={() => setMode("merge")} className="mt-1" />
          <span>
            <strong>Merge</strong> — add new items and update items with the same slug, URL or email. Nothing on this site is deleted. Best for uploading articles written
            elsewhere.
          </span>
        </label>
        <label className="flex items-start gap-2">
          <input type="radio" name="mode" value="replace" checked={mode === "replace"} onChange={() => setMode("replace")} className="mt-1" />
          <span>
            <strong>Replace</strong> — delete current content first, then restore exactly what is in the backup. Use for disaster recovery.
          </span>
        </label>
      </fieldset>

      <fieldset className="space-y-2 text-sm">
        <legend className="label">Also restore</legend>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="includeSubscribers" defaultChecked /> Newsletter subscribers and contact messages
        </label>
        <label className="flex items-start gap-2">
          <input type="checkbox" name="includeUsers" className="mt-1" />
          <span>
            Admin user accounts <span className="text-muted">(passwords will change to those in the backup — leave unchecked to keep current logins)</span>
          </span>
        </label>
      </fieldset>

      <button type="submit" className={mode === "replace" ? "btn-danger" : "btn-primary"} disabled={pending}>
        {pending ? "Restoring… do not close this page" : mode === "replace" ? "Replace site content" : "Merge backup into site"}
      </button>

      {result && (
        <div role="status" className={`rounded-md px-4 py-3 text-sm ${result.ok ? "bg-emerald-50 text-emerald-900" : "bg-red-50 text-red-700"}`}>
          {result.ok ? (
            <>
              <p className="font-semibold">Restore complete ({result.mode}).</p>
              <p className="mt-1">
                {Object.entries(result.result ?? {})
                  .map(([k, v]) => `${v} ${k}`)
                  .join(" · ")}
              </p>
              <p className="mt-1 text-xs">
                Backup from {result.source ?? "unknown site"}, created {result.backupCreatedAt}. Safety backup of the previous data: <code>{result.safetyBackup}</code>
              </p>
            </>
          ) : (
            result.message
          )}
        </div>
      )}
    </form>
  );
}
