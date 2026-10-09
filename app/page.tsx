import { ArtCard } from "@/components/ArtCard";
import { Backers } from "@/components/Backers";
import { Pill } from "@/components/Button";
import { CardSim, type CardKind } from "@/components/CardSim";
import { HeroScene } from "@/components/HeroScene";
import { HowTabs } from "@/components/HowTabs";
import { TestQueueLazy } from "@/components/scenes/TestQueueLazy";
import { Lines } from "@/components/Lines";
import { Pipeline } from "@/components/diagrams/Pipeline";
import { DitherField } from "@/components/sims/DitherField";
import { SHOW_METRICS } from "@/lib/config";
import { allPosts, formatDate, type Post } from "@/lib/posts";
import Link from "next/link";
import { PaperCover } from "@/components/PaperCover";

export default async function Home() {
  const posts = (await allPosts()).sort((a, b) => Number(!!b.featured) - Number(!!a.featured)).slice(0, 3);
  return (
    <>
      <Hero />
      <Statement />
      <Approach />
      <BuiltFor />
      {SHOW_METRICS && <Numbers />}
      <Research posts={posts} />
      <Letter />
    </>
  );
}

/* ───────────────────────── Hero ───────────────────────── */
function Hero() {
  return (
    <section className="relative overflow-hidden pb-10 pt-6 md:pb-16 md:pt-10" aria-labelledby="hero-h">
      <div className="wrap grid items-center gap-6 lg:min-h-[calc(100svh-96px)] lg:grid-cols-12 lg:gap-6">
        <div className="relative z-10 lg:col-span-5">
          <Lines
            as="h1"
            id="hero-h"
            auto
            className="t-hero"
            lines={[
              "Predict the test.",
              <span key="2" className="text-faint">
                Run it only when
              </span>,
              <span key="3" className="text-faint">
                you&rsquo;re <em className="text-fg">unsure</em>.
              </span>,
            ]}
          />
          <p className="t-lede load-in mt-7 max-w-[44ch] text-muted" style={{ ["--delay" as string]: "350ms" }}>
            OpenWM is a world model for physical design. It forecasts how a part will perform, tells you how confident it
            is, and sends only the uncertain cases to real simulation.
          </p>
          <div className="load-in mt-9 flex flex-wrap items-center gap-3" style={{ ["--delay" as string]: "450ms" }}>
            <Pill href="/pilot/">Request a pilot</Pill>
            <Pill href="#approach" tone="light">
              See it work
            </Pill>
          </div>
          <Backers className="load-in mt-10 w-fit" />
        </div>
        <div className="load-in relative lg:col-span-7" style={{ ["--delay" as string]: "200ms" }}>
          <HeroScene />
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── Statement (two cards) ───────────────────────── */
function Statement() {
  return (
    <section className="pb-16 md:pb-24" aria-label="Thesis">
      <div className="wrap grid gap-4 lg:grid-cols-12">
        <div className="reveal relative isolate min-h-[340px] overflow-hidden rounded-[20px] bg-[#ecd58f] sm:min-h-[420px] lg:col-span-5 lg:min-h-[520px]">
          <DitherField
            className="absolute inset-0 -z-10"
            color="#fbf4dc"
            shade="#f6e7b5"
            coverage={0.5}
            scale={0.0065}
            softness={0.15}
            seed={3}
          />
          <TestQueueLazy />
          <p className="t-mono absolute bottom-4 left-5 text-[10px] text-fg/70">Fig. 1 — Where rig hours go (illustrative)</p>
        </div>
        <div className="reveal card flex flex-col justify-between p-7 sm:p-10 lg:col-span-7 lg:p-14">
          <p className="t-mono text-muted">The problem</p>
          <blockquote className="t-statement mt-10 max-w-[22ch]">
            Most simulation spend goes to tests whose answer was already predictable. The expensive part isn&rsquo;t
            computing &mdash; it&rsquo;s not knowing <em>which</em> runs actually matter.
          </blockquote>
          <div className="mt-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <p className="max-w-[46ch] text-[16px] text-muted">
              A detailed CFD run can take hours; a prototype, weeks. Teams respond by testing less and guessing more.
              OpenWM replaces the guess with a prediction that states its own confidence.
            </p>
            <Pill href="#approach" tone="light" small className="self-start sm:self-auto">
              How it works
            </Pill>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── Approach ───────────────────────── */
function Approach() {
  return (
    <section id="approach" className="scroll-mt-20 pb-16 md:pb-24" aria-labelledby="how-h">
      <div className="wrap">
        <div className="mx-auto max-w-3xl text-center">
          <Lines
            id="how-h"
            className="t-h2"
            lines={[
              <>
                Predict, doubt, <em>verify</em>.
              </>,
            ]}
          />
          <p className="reveal mx-auto mt-5 max-w-[52ch] text-[18px] text-muted">
            From CAD to a verified prototype, without building the ones you didn&rsquo;t need to.
          </p>
        </div>
        <div className="mt-12 md:mt-16">
          <HowTabs />
        </div>

        <figure className="reveal card mt-14 p-5 sm:p-8 md:mt-20">
          <figcaption className="t-mono mb-6 flex justify-between text-muted">
            <span>Fig. 2 — The confidence gate</span>
            <span className="hidden sm:inline">τ = your threshold</span>
          </figcaption>
          <Pipeline className="text-fg" />
        </figure>
      </div>
    </section>
  );
}

/* ───────────────────────── Built for (dark band) ───────────────────────── */
type UseCase = { tags: string[]; title: string; body: string; sim: CardKind; bg: string; dark?: boolean };

const HARDWARE: UseCase[] = [
  {
    tags: ["Drones", "Aero"],
    title: "Airframes & propellers",
    body: "Screen hundreds of geometries before a single CFD run.",
    sim: "prop",
    bg: "bg-sky-deep",
    dark: true,
  },
  {
    tags: ["Thermal"],
    title: "Heat sinks & cooling",
    body: "Predict thermal performance before you machine a prototype.",
    sim: "thermal",
    bg: "bg-[#f4f1ea]",
  },
  {
    tags: ["Structures"],
    title: "Mounts, frames & trusses",
    body: "Stress and deflection in seconds; FEA only where the model is unsure.",
    sim: "truss",
    bg: "bg-[#e8eef6]",
  },
  {
    tags: ["Small teams"],
    title: "Your past runs, reused",
    body: "No enterprise budget — the simulations you already have become the model.",
    sim: "surface",
    bg: "bg-[#efe3c4]",
  },
];

const BIOLOGY: UseCase[] = [
  {
    tags: ["Tissue"],
    title: "Tissue engineering",
    body: "Scaffold geometry and seeding conditions, predicted before you culture.",
    sim: "tissue",
    bg: "bg-[#1f4a46]",
    dark: true,
  },
  {
    tags: ["Bioprocess"],
    title: "Fermentation & bioreactors",
    body: "Forecast yield across feed, pH and agitation — run only the batches that matter.",
    sim: "bioreactor",
    bg: "bg-[#e4efd9]",
  },
  {
    tags: ["Proteins"],
    title: "Protein & enzyme design",
    body: "Confidence per region: trust the well-predicted parts, express the uncertain ones.",
    sim: "protein",
    bg: "bg-[#24324a]",
    dark: true,
  },
  {
    tags: ["Assays"],
    title: "Screens & well plates",
    body: "Predict the plate; pipette only the wells the model can't call.",
    sim: "plate",
    bg: "bg-[#f6efe2]",
  },
];

function UseCaseCard({ c, later = false }: { c: UseCase; later?: boolean }) {
  return (
    <li
      className={`reveal relative isolate flex min-h-[400px] flex-col overflow-hidden rounded-[20px] ${c.bg} ${
        c.dark ? "text-white" : "text-fg"
      }`}
    >
      <div className="relative h-[220px] shrink-0">
        <CardSim kind={c.sim} />
      </div>
      <div className="mt-auto p-5">
        <div className="flex flex-wrap gap-1.5">
          {c.tags.map((t) => (
            <span key={t} className={c.dark ? "chip on-dark" : "chip"}>
              {t}
            </span>
          ))}
          {later && <span className={`${c.dark ? "chip on-dark" : "chip"} ml-auto`}>Next</span>}
        </div>
        <h3 className="t-h3 mt-4">{c.title}</h3>
        <p className={`mt-2 text-[15px] leading-relaxed ${c.dark ? "text-white/75" : "text-muted"}`}>{c.body}</p>
      </div>
    </li>
  );
}

function BuiltFor() {
  return (
    <section
      id="built-for"
      className="relative isolate scroll-mt-20 overflow-hidden bg-night py-16 text-white md:py-24"
      aria-labelledby="built-h"
    >
      <div className="wrap">
        <div className="grid gap-6 md:grid-cols-12 md:items-end">
          <Lines
            id="built-h"
            className="t-h2 md:col-span-8"
            lines={[
              "Built for teams where",
              <>
                one test costs <em>days</em>.
              </>,
            ]}
          />
          <p className="reveal max-w-[40ch] text-white/70 md:col-span-4">
            The same predict-then-verify loop works wherever a real experiment is slow or expensive — on the bench today,
            in the wet lab next.
          </p>
        </div>

        <div className="mt-12 flex items-baseline justify-between border-t border-white/15 pt-5 md:mt-16">
          <h3 className="t-mono text-white/80">Hardware</h3>
          <span className="t-mono text-white/50">Piloting now</span>
        </div>
        <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {HARDWARE.map((c) => (
            <UseCaseCard key={c.title} c={c} />
          ))}
        </ul>

        <div className="mt-12 flex items-baseline justify-between border-t border-white/15 pt-5">
          <h3 className="t-mono text-white/80">Biology</h3>
          <span className="t-mono text-white/50">Next</span>
        </div>
        <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {BIOLOGY.map((c) => (
            <UseCaseCard key={c.title} c={c} later />
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ───────────────────────── Research & insights ───────────────────────── */
const COVER_TONES = ["sand", "teal"] as const;

function Research({ posts }: { posts: Post[] }) {
  if (!posts.length) return null;
  return (
    <section className="pt-16 md:pt-24" aria-labelledby="research-h">
      <div className="wrap">
        <div className="mx-auto max-w-3xl text-center">
          <Lines
            id="research-h"
            className="t-h2"
            lines={[
              <>
                Research &amp; <em>insights</em>
              </>,
            ]}
          />
          <p className="reveal mx-auto mt-5 max-w-[48ch] text-[18px] text-muted">
            What we&rsquo;re learning about world models, surrogates, and knowing when not to trust them.
          </p>
        </div>
        <ul className="mt-12 grid gap-4 md:mt-16 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((p, i) => (
            <li key={p.slug} className="reveal">
              <Link href={`/research/${p.slug}/`} className="card group flex h-full flex-col overflow-hidden transition-colors hover:border-line-strong">
                <div className="p-6 pb-5 sm:p-7 sm:pb-6">
                  <p className="t-mono flex flex-wrap gap-x-2 text-muted">
                    <time dateTime={p.date}>{formatDate(p.date)}</time>
                    {p.featured && <span className="text-fg">· Paper</span>}
                  </p>
                  <h3 className="t-h3 mt-4">{p.title}</h3>
                  <p className="mt-3 line-clamp-3 text-[15px] leading-relaxed text-muted">{p.dek}</p>
                </div>
                <div className="mt-auto px-3 pb-3">
                  {p.featured ? (
                    <ArtCard tone="paper" texture="grid" className="aspect-[16/10] rounded-[14px]">
                      <PaperCover className="absolute inset-0 h-full w-full" />
                    </ArtCard>
                  ) : (
                    <ArtCard tone={COVER_TONES[i % 2]} seed={i * 7 + 3} className="aspect-[16/10] rounded-[14px]">
                      <span className="t-mono absolute bottom-3 left-4 rounded-full bg-surface/90 px-2.5 py-1 text-[10px] text-muted">
                        {p.tags[0] ?? "Note"}
                      </span>
                    </ArtCard>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
        <div className="reveal mt-10 flex justify-center">
          <Pill href="/research/" tone="light">
            All research
          </Pill>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── Numbers (hidden by default) ───────────────────────── */
// Do not ship until real numbers exist. Hide section via SHOW_METRICS=false.
function Numbers() {
  const items = [
    ["[PLACEHOLDER]%", "fewer simulation runs"],
    ["[PLACEHOLDER]×", "faster design iteration"],
    ["[PLACEHOLDER]", "teams in pilot"],
  ];
  return (
    <section className="pt-16 md:pt-24" aria-label="Numbers">
      <div className="wrap grid gap-4 md:grid-cols-3">
        {items.map(([v, l]) => (
          <div key={l} className="reveal card p-8">
            <p className="font-display text-[clamp(40px,5vw,72px)] leading-none outline-1 outline-dashed outline-faint">
              {v}
            </p>
            <p className="t-mono mt-3 text-muted">{l}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ───────────────────────── Founders' letter ───────────────────────── */
function Letter() {
  return (
    <section className="pb-12 pt-16 md:pb-16 md:pt-24" aria-labelledby="letter-h">
      <div className="wrap grid gap-4 lg:grid-cols-12">
        <div className="reveal card p-7 sm:p-10 lg:col-span-8 lg:p-14">
          <h2 id="letter-h" className="t-mono text-muted">
            A note from the founders
          </h2>
          <div className="t-lede mt-8 max-w-[58ch] space-y-5 text-[#3c3c48] lg:text-[20px]">
            <p>
              We started OpenWM after watching good engineering teams burn weeks on simulations whose answers they could
              have guessed &mdash; and then, just as often, trust a fast model that was quietly wrong.
            </p>
            <p>
              We think the fix is a model that knows what it doesn&rsquo;t know. One that predicts when it can, says so
              when it can&rsquo;t, and makes verification a habit instead of an afterthought.
            </p>
            <p>
              We&rsquo;re building it first for hardware teams who can&rsquo;t afford to test everything, and can&rsquo;t
              afford to test the wrong thing. If that&rsquo;s you, we&rsquo;d like to hear what you&rsquo;re building.
            </p>
          </div>
          <p className="mt-10 font-display text-[34px] italic leading-none">&mdash; The OpenWM team</p>
        </div>
        <ArtCard tone="copper" seed={6} className="reveal min-h-[260px] lg:col-span-4">
          <div className="absolute inset-4 grid place-items-center rounded-xl border border-dashed border-fg/30">
            <span className="t-mono rounded-full bg-copper-soft px-3 py-1.5 text-[10px] text-fg/70">[PLACEHOLDER: team photo]</span>
          </div>
        </ArtCard>
      </div>
    </section>
  );
}
