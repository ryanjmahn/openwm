"use client";

import dynamic from "next/dynamic";
import { useId, useRef, useState, type KeyboardEvent } from "react";

const Loading = () => <div className="aspect-[16/10] w-full animate-pulse rounded-xl bg-base" />;
const BracketPredict = dynamic(() => import("./scenes/BracketPredict").then((m) => m.BracketPredict), { ssr: false, loading: Loading });
const ColdPlateDoubt = dynamic(() => import("./scenes/ColdPlateDoubt").then((m) => m.ColdPlateDoubt), { ssr: false, loading: Loading });
const PropVerify = dynamic(() => import("./scenes/PropVerify").then((m) => m.PropVerify), { ssr: false, loading: Loading });

const TABS = [
  {
    n: "01",
    title: "Predict",
    body: "A world model trained on your past designs and simulations estimates performance in seconds — stress and deflection on a bracket, before anyone meshes it for a three-hour FEA run.",
    hint: "Structural example: a drone motor mount under thrust load.",
    Sim: () => <BracketPredict />,
  },
  {
    n: "02",
    title: "Measure doubt",
    body: "Every prediction carries a calibrated uncertainty. Familiar geometry is predicted with confidence; a feature the model has never seen lights up — and drops below your threshold.",
    hint: "Thermal example: a cold plate where one pin geometry is new to the model.",
    Sim: () => <ColdPlateDoubt />,
  },
  {
    n: "03",
    title: "Verify selectively",
    body: "Only the uncertain designs become hardware. The prototype goes on your bench, the measurement comes back as training data, and the next nearby design is predicted instead of built.",
    hint: "Aero example: a printed prop on a thrust stand, measured against its prediction.",
    Sim: () => <PropVerify />,
  },
];

export function HowTabs() {
  const [active, setActive] = useState(0);
  const id = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const onKey = (e: KeyboardEvent) => {
    const d = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const n = (active + d + TABS.length) % TABS.length;
    setActive(n);
    refs.current[n]?.focus();
  };
  const tab = TABS[active];

  return (
    <div className="grid gap-6 lg:grid-cols-12 lg:gap-10">
      <div role="tablist" aria-label="How it works" aria-orientation="vertical" className="-mx-[var(--gutter)] flex gap-2 overflow-x-auto px-[var(--gutter)] pb-1 lg:col-span-4 lg:mx-0 lg:flex-col lg:gap-0 lg:overflow-visible lg:px-0" onKeyDown={onKey}>
        {TABS.map((t, i) => {
          const on = i === active;
          return (
            <button
              key={t.n}
              ref={(el) => {
                refs.current[i] = el;
              }}
              role="tab"
              id={`${id}-t${i}`}
              aria-selected={on}
              aria-controls={`${id}-p`}
              tabIndex={on ? 0 : -1}
              onClick={() => setActive(i)}
              className={`group shrink-0 rounded-full border px-4 py-2.5 text-left transition-colors lg:rounded-none lg:border-0 lg:border-b lg:px-0 lg:py-5 ${
                on ? "border-fg bg-fg text-white lg:border-line lg:bg-transparent lg:text-fg" : "border-line bg-surface text-muted hover:text-fg lg:bg-transparent"
              }`}
            >
              <span className="flex items-baseline gap-3">
                <span className="t-mono text-[10px] lg:w-6">{t.n}</span>
                <span className={`font-display text-[20px] leading-tight lg:text-[30px] ${on ? "" : "lg:text-faint"}`}>{t.title}</span>
              </span>
              <span className={`hidden overflow-hidden pl-9 text-[15px] leading-relaxed text-muted transition-[max-height] duration-500 lg:block ${on ? "mt-3 max-h-60" : "max-h-0"}`}>
                {t.body}
              </span>
            </button>
          );
        })}
      </div>
      <div id={`${id}-p`} role="tabpanel" aria-labelledby={`${id}-t${active}`} className="lg:col-span-8">
        <p className="mb-5 text-[15px] leading-relaxed text-muted lg:hidden">{tab.body}</p>
        <div className="card p-3 sm:p-5">
          <tab.Sim key={active} />
        </div>
        <p className="t-mono mt-3 text-[10px] text-muted">
          {tab.hint} <span className="text-faint">· Illustrative.</span>
        </p>
      </div>
    </div>
  );
}
