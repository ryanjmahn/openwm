import type { Metadata } from "next";
import { ArtCard } from "@/components/ArtCard";
import { Backers } from "@/components/Backers";
import { Button } from "@/components/Button";
import { Frame } from "@/components/Frame";
import { Lines } from "@/components/Lines";
import { Rule } from "@/components/Rule";
import { SectionLabel } from "@/components/SectionLabel";

export const metadata: Metadata = {
  title: "About",
  description: "OpenWM builds world models for physical design that know what they don't know.",
};

// [PLACEHOLDER: real team members — names, roles, photos]
const TEAM = Array.from({ length: 4 }, () => ({
  name: "[PLACEHOLDER: name]",
  role: "[PLACEHOLDER: role]",
}));

const BELIEFS = [
  {
    title: "Verification is a culture, not a phase.",
    body: "The best teams check their assumptions continuously. Tools should make that the easy path, not the expensive one.",
  },
  {
    title: "Honesty about uncertainty.",
    body: "A model that says “I don’t know” is more useful than one that is confidently wrong. Every number we show comes with how much to trust it.",
  },
  {
    title: "Small teams deserve great tools.",
    body: "Serious simulation infrastructure shouldn’t require an enterprise budget. We build for teams that have to make every test count.",
  },
];

export default function About() {
  return (
    <>
      <section className="pb-16 pt-10 md:pb-24 md:pt-16">
        <div className="wrap journal">
          <div className="journal-label">
            <SectionLabel name="About" className="text-muted" />
            <ArtCard tone="sand" seed={4} className="mt-6 aspect-[16/6] lg:mt-8 lg:aspect-[4/5]" />
          </div>
          <div className="journal-body">
            <Lines
              as="h1"
              auto
              className="t-h2"
              lines={[
                "Models that know",
                <>
                  what they don&rsquo;t <em>know</em>.
                </>,
              ]}
            />
            <div className="mt-10 max-w-[62ch] space-y-5 text-muted">
              <p className="load-in" style={{ ["--delay" as string]: "300ms" }}>
                OpenWM builds world models for physical design: models that predict how a part will perform, report how
                confident they are, and hand the uncertain cases to a real solver or bench test. We call it a
                pre-research verification layer&thinsp;&mdash;&thinsp;the step before you spend hours of compute or
                build a prototype.
              </p>
              <p className="load-in" style={{ ["--delay" as string]: "380ms" }}>
                We&rsquo;re starting with drone and thermal hardware, where a single test can cost days. The same
                predict-then-verify loop applies well beyond mechanical design, and we expect to follow it there.
              </p>
            </div>
            <Backers className="load-in mt-10 w-fit" />
          </div>
        </div>
      </section>
      <Rule />
      <section className="section">
        <div className="wrap journal">
          <div className="journal-label">
            <SectionLabel n="01" name="Team" className="text-muted" />
          </div>
          <ul className="journal-body grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
            {TEAM.map((m, i) => (
              <li key={i} className="reveal">
                <Frame>
                  <div className="t-mono flex aspect-[4/5] items-center justify-center bg-surface p-4 text-center text-[10px] text-muted grayscale">
                    [PLACEHOLDER: photo]
                  </div>
                </Frame>
                <p className="mt-4 font-display text-[22px] leading-tight">{m.name}</p>
                <p className="t-mono mt-1 text-muted">{m.role}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <section className="section">
        <div className="wrap journal">
          <div className="journal-label">
            <SectionLabel n="02" name="What we believe" className="text-muted" />
          </div>
          <ol className="journal-body border-t border-line">
            {BELIEFS.map((b, i) => (
              <li key={b.title} className="reveal grid gap-4 border-b border-line py-10 md:grid-cols-9">
                <span className="t-mono text-muted md:col-span-1">0{i + 1}</span>
                <h2 className="t-h3 md:col-span-4">{b.title}</h2>
                <p className="text-muted md:col-span-4">{b.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <section className="section">
        <div className="wrap flex flex-wrap items-end justify-between gap-8">
          <Lines
            className="t-h2"
            lines={[
              <>
                Working on something <em>hard</em> to test?
              </>,
            ]}
          />
          <div className="reveal">
            <Button href="/pilot/">Request a pilot</Button>
          </div>
        </div>
      </section>
    </>
  );
}
