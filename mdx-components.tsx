import type { MDXComponents } from "mdx/types";
import type { ReactNode } from "react";
import { UncertaintyFigure } from "@/components/UncertaintyFigure";

/** `<Figure n={1} caption="…">…</Figure>` — a card figure with a mono FIG. N caption. */
function Figure({ n, caption, children }: { n: number; caption: string; children: ReactNode }) {
  return (
    <figure className="prose-reset my-12 lg:-mr-[8ch]">
      <div className="card p-4 sm:p-6">{children}</div>
      <figcaption className="t-mono mt-3 flex gap-3 text-muted">
        <span className="shrink-0 text-fg">Fig. {n}</span>
        <span>{caption}</span>
      </figcaption>
    </figure>
  );
}

/** Opening summary card. */
function Abstract({ children }: { children: ReactNode }) {
  return (
    <section className="prose-reset card mb-14 p-6 sm:p-8" aria-label="Abstract">
      <p className="t-mono text-muted">Abstract</p>
      <div className="mt-4 space-y-3 text-[19px] leading-relaxed text-fg">{children}</div>
    </section>
  );
}

function PullQuote({ children }: { children: ReactNode }) {
  return (
    <blockquote className="prose-reset my-12 border-l-2 border-copper pl-6 font-display text-[clamp(28px,3vw,38px)] leading-[1.15] text-fg">
      {children}
    </blockquote>
  );
}

/** Dashed callout for content that still has to be written. */
function Note({ children }: { children: ReactNode }) {
  return (
    <aside className="prose-reset my-8 rounded-[14px] border border-dashed border-line-strong bg-surface/60 p-5 text-[15px] leading-relaxed text-muted">
      <p className="t-mono mb-2 text-[10px] text-copper">To be written</p>
      {children}
    </aside>
  );
}

function Takeaways({ items }: { items: { title: string; body: string }[] }) {
  return (
    <ol className="prose-reset my-10 grid gap-3 sm:grid-cols-3 lg:-mr-[8ch]">
      {items.map((it, i) => (
        <li key={it.title} className="card flex flex-col p-5">
          <span className="t-mono text-muted">0{i + 1}</span>
          <p className="mt-6 font-display text-[22px] leading-[1.15]">{it.title}</p>
          <p className="mt-3 text-[14.5px] leading-relaxed text-muted">{it.body}</p>
        </li>
      ))}
    </ol>
  );
}

const components: MDXComponents = { Figure, UncertaintyFigure, Abstract, PullQuote, Note, Takeaways };

export function useMDXComponents(): MDXComponents {
  return components;
}
