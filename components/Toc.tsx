"use client";

import { useEffect, useState } from "react";

/** Sticky contents list with scroll-spy. */
export function Toc({ items }: { items: { id: string; text: string }[] }) {
  const [active, setActive] = useState(items[0]?.id);
  useEffect(() => {
    const els = items.map((i) => document.getElementById(i.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (vis[0]) setActive(vis[0].target.id);
      },
      { rootMargin: "-90px 0px -65% 0px" },
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, [items]);
  if (!items.length) return null;
  return (
    <nav aria-label="Contents">
      <p className="t-mono text-muted">Contents</p>
      <ol className="mt-4 space-y-1 border-l border-line">
        {items.map((it, i) => (
          <li key={it.id}>
            <a
              href={`#${it.id}`}
              aria-current={active === it.id ? "true" : undefined}
              className={`-ml-px block border-l py-1.5 pl-4 text-[14px] leading-snug transition-colors ${
                active === it.id ? "border-fg text-fg" : "border-transparent text-muted hover:text-fg"
              }`}
            >
              <span className="t-mono mr-2 text-[10px] text-faint">§{String(i + 1).padStart(2, "0")}</span>
              {it.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
