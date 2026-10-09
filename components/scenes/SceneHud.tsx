import type { ReactNode } from "react";

/** Readout card overlaid on a scene (same style as the hero HUD). */
export function SceneHud({
  kicker,
  title,
  rows,
  status,
  className = "",
  below = false,
}: {
  kicker: string;
  title: string;
  rows: [string, ReactNode][];
  status?: { text: string; tone: "fg" | "blue" | "copper" };
  className?: string;
  /** Phones: render under the canvas instead of over it. */
  below?: boolean;
}) {
  return (
    <div
      className={`pointer-events-none rounded-xl border border-line bg-surface/90 px-3 py-2.5 backdrop-blur-sm sm:px-4 sm:py-3 ${
        below ? "mt-3 sm:hidden" : "absolute left-3 top-3 hidden max-w-[86%] sm:block"
      } ${className}`}
      aria-hidden="true"
    >
      <p className="t-mono text-[10px] text-muted">{kicker}</p>
      <p className="font-display text-[18px] leading-tight sm:text-[21px]">{title}</p>
      <dl className="t-mono mt-2 grid grid-cols-[auto_auto] gap-x-4 gap-y-0.5 text-[10px] sm:text-[11px]">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-muted">{k}</dt>
            <dd className="tabular-nums">{v}</dd>
          </div>
        ))}
      </dl>
      {status && (
        <p
          className={`t-mono mt-2 inline-block rounded-full px-2 py-1 text-[10px] ${
            status.tone === "blue"
              ? "bg-blue text-white"
              : status.tone === "copper"
                ? "bg-copper text-white"
                : "bg-fg text-white"
          }`}
        >
          {status.text}
        </p>
      )}
    </div>
  );
}
