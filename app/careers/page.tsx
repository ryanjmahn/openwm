import type { Metadata } from "next";
import { ArtCard } from "@/components/ArtCard";
import { Lines } from "@/components/Lines";
import { SectionLabel } from "@/components/SectionLabel";
import { SITE } from "@/lib/config";

export const metadata: Metadata = {
  title: "Careers",
  description: "Work on world models for physical design at OpenWM.",
};

export default function Careers() {
  return (
    <section className="pb-24 pt-10 md:pb-48 md:pt-16">
      <div className="wrap journal">
        <div className="journal-label">
          <SectionLabel name="Careers" className="text-muted" />
            <ArtCard tone="teal" seed={9} className="mt-6 aspect-[16/6] lg:mt-8 lg:aspect-[4/5]" />
        </div>
        <div className="journal-body">
          <Lines
            as="h1"
            auto
            className="t-h2"
            lines={[
              "Build the model that",
              <>
                knows when to <em>ask</em>.
              </>,
            ]}
          />
          <p className="load-in mt-10 max-w-[62ch] text-muted" style={{ ["--delay" as string]: "300ms" }}>
            We&rsquo;re a small team working where machine learning meets physical engineering: surrogate models,
            uncertainty estimation, simulation pipelines, and the product that ties them together for hardware teams. If
            you care about getting the physics right and being honest about what a model doesn&rsquo;t know, we&rsquo;d
            like to talk.
          </p>
          <div className="load-in mt-16 border-t border-line pt-8" style={{ ["--delay" as string]: "400ms" }}>
            <p className="t-h3">No open roles listed&thinsp;&mdash;&thinsp;write to us anyway.</p>
            <a href={`mailto:${SITE.email}`} className="link t-mono mt-6 normal-case tracking-normal text-[14px]">
              {SITE.email}
              <span className="arrow" aria-hidden="true">
                →
              </span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
