import type { Metadata } from "next";
import { ArtCard } from "@/components/ArtCard";
import { Lines } from "@/components/Lines";
import { PilotForm } from "@/components/PilotForm";
import { SectionLabel } from "@/components/SectionLabel";
import { SITE } from "@/lib/config";

export const metadata: Metadata = {
  title: "Request a pilot",
  description: "Send OpenWM a design problem where one run costs hours or a prototype.",
};

export default function Pilot() {
  return (
    <section className="pb-24 pt-10 md:pb-32 md:pt-16">
      <div className="wrap journal">
        <div className="journal-label">
          <SectionLabel name="Request a pilot" className="text-muted" />
            <ArtCard tone="paper" texture="grid" className="mt-6 aspect-[16/6] lg:mt-8 lg:aspect-[4/5]" />
          <div className="t-mono mt-8 hidden space-y-1 text-muted lg:block">
            <p>Reply within a few days</p>
            <p>
              Or write to{" "}
              <a className="link normal-case tracking-normal text-fg" href={`mailto:${SITE.email}`}>
                {SITE.email}
              </a>
            </p>
          </div>
        </div>
        <div className="journal-body">
          <Lines
            as="h1"
            auto
            className="t-h2"
            lines={[
              "Tell us what",
              <>
                you&rsquo;re <em>testing</em>.
              </>,
            ]}
          />
          <p className="t-lede load-in mt-8 max-w-[52ch] text-muted" style={{ ["--delay" as string]: "300ms" }}>
            Describe a design problem where one run costs hours, days, or a prototype. We&rsquo;ll tell you honestly
            whether a world model can cut it down.
          </p>
          <PilotForm />
        </div>
      </div>
    </section>
  );
}
