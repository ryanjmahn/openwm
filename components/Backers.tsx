import { BACKERS } from "@/lib/config";

/** "Backed by" pill — backer wordmark + programme name, evenly spaced. */
export function Backers({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {BACKERS.map((b) => (
        <a
          key={b.name}
          href={b.href}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex h-12 items-center gap-3 rounded-full border border-line bg-surface px-5 transition-colors hover:border-line-strong"
        >
          <span className="t-mono text-[10px] leading-none text-muted">Backed by</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={b.logo} alt={b.logoAlt} width={b.logoWidth} height={b.logoHeight} className="block h-[15px] w-auto" />
          <span className="t-mono text-[10px] leading-none text-muted">Founder Program</span>
          <span className="arrow text-[13px] leading-none text-muted group-hover:text-fg" aria-hidden="true">
            ↗
          </span>
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      ))}
    </div>
  );
}
