import type { ReactNode } from "react";

/**
 * Headline split by line: each line rises out of an overflow-hidden mask.
 * Pass one child per visual line. `auto` animates on load (hero) instead of on scroll.
 */
export function Lines({
  lines,
  className = "",
  as: Tag = "h2",
  auto = false,
  id,
}: {
  lines: ReactNode[];
  className?: string;
  as?: "h1" | "h2" | "h3" | "p";
  auto?: boolean;
  id?: string;
}) {
  return (
    <Tag id={id} className={`${className} ${auto ? "lines-auto" : "lines-reveal"}`}>
      {lines.map((l, i) => (
        <span key={i} className="line-mask">
          <span style={{ ["--delay" as string]: `${i * 90}ms` }}>{l}</span>
        </span>
      ))}
    </Tag>
  );
}
