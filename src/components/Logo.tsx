export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="7" fill="#0f172a" />
      <rect x="6.5" y="8" width="4" height="16" rx="1" fill="#f59e0b" />
      <circle cx="19.5" cy="15" r="5.5" fill="none" stroke="#ffffff" strokeWidth="3" />
      <path d="M23 19.5l3 4.5" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function Logo() {
  return (
    <span className="flex items-center gap-2">
      <LogoMark />
      <span className="text-xl font-bold tracking-tight text-ink">
        Indu<span className="text-brand">qora</span>
      </span>
    </span>
  );
}
