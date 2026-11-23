import { runScheduledBackup } from "./backup";

export function startBackupScheduler() {
  const hours = Number(process.env.BACKUP_INTERVAL_HOURS ?? 24);
  if (!hours || hours <= 0 || process.env.NEXT_PHASE === "phase-production-build") return;

  const run = () => runScheduledBackup(hours).catch((e) => console.error("[induqora] scheduled backup failed:", e));
  // Check hourly; a new backup is only written once the latest one is older than the interval.
  setTimeout(run, 60_000).unref();
  setInterval(run, Math.min(hours, 1) * 3600 * 1000).unref();
}
