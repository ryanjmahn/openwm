import Link from "next/link";
import { BACKERS, SITE, SOCIALS } from "@/lib/config";
import { Pill } from "./Button";
import { HideOn } from "./HideOn";
import { DitherField } from "./sims/DitherField";

const LINKS = [
  { label: "Approach", href: "/#approach" },
  { label: "Built for", href: "/#built-for" },
  { label: "Research", href: "/research/" },
  { label: "About", href: "/about/" },
  { label: "Careers", href: "/careers/" },
  { label: "Request a pilot", href: "/pilot/" },
];

export function Footer() {
  return (
    <footer className="pb-8 pt-4">
      <div className="wrap">
        <section
          aria-labelledby="cta-h"
          className="relative isolate overflow-hidden rounded-[20px] bg-sky px-6 pb-10 pt-14 text-white sm:px-10 md:px-14 md:pb-14 md:pt-20"
        >
          {/* dithered cloud bank */}
          <DitherField
            className="absolute inset-x-0 bottom-0 -z-10 h-[46%]"
            color="#f4f6fb"
            shade="#c9d8ec"
            mask="bottom"
            coverage={0.5}
            scale={0.0042}
            softness={0.12}
            cell={5}
            seed={11}
          />
          <HideOn path="/pilot/">
          <div className="grid gap-12 md:grid-cols-12">
            <div className="md:col-span-8 md:col-start-3 md:text-center">
              <h2 id="cta-h" className="t-h2 text-[clamp(44px,6vw,96px)]">
                Tell us what you&rsquo;re <em>testing</em>.
              </h2>
              <p className="t-lede mx-auto mt-6 max-w-[46ch] text-white/85">
                Send us a design problem where one run costs hours or a prototype. We&rsquo;ll tell you whether a world model can cut it down.
              </p>
              <p className="mt-3 text-[15px] text-white/80">
                Or write to{" "}
                <a href={`mailto:${SITE.email}`} className="link text-white">
                  {SITE.email}
                </a>
              </p>
              <div className="mt-8 flex md:justify-center">
                <Pill href="/pilot/" tone="light">
                  Request a pilot
                </Pill>
              </div>
            </div>
          </div>
          </HideOn>
          <nav aria-label="Footer" className="mt-16 flex flex-wrap gap-2 md:mt-28">
            {LINKS.map((l) => (
              <Link key={l.label} href={l.href} className="t-mono rounded-full bg-white/90 px-3.5 py-2 text-[10px] text-fg transition-colors hover:bg-white">
                {l.label}
              </Link>
            ))}
          </nav>
        </section>

        <div className="t-mono mt-6 flex flex-col gap-4 text-muted sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="font-display text-[24px] normal-case tracking-[-0.02em] text-fg">
            OpenWM
          </Link>
          <span>
            © 2026 OpenWM · Backed by{" "}
            <a href={BACKERS[0].href} target="_blank" rel="noopener noreferrer" className="link text-fg">
              {BACKERS[0].name}
            </a>
          </span>
          <ul className="flex gap-5">
            {SOCIALS.map((s) => (
              <li key={s.label}>
                <a href={s.href} className="link">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
