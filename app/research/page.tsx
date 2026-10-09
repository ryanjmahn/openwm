import type { Metadata } from "next";
import Link from "next/link";
import { ArtCard } from "@/components/ArtCard";
import { Pill } from "@/components/Button";
import { Lines } from "@/components/Lines";
import { PaperCover } from "@/components/PaperCover";
import { PostCard } from "@/components/PostCard";
import { SectionLabel } from "@/components/SectionLabel";
import { allPosts, formatDate } from "@/lib/posts";

export const metadata: Metadata = {
  title: "Research",
  description: "Research and notes from OpenWM on world models, surrogate models, and uncertainty-gated design.",
};

export default async function ResearchIndex() {
  const posts = await allPosts();
  const featured = posts.find((p) => p.featured) ?? posts[0];
  const rest = posts.filter((p) => p !== featured);

  return (
    <>
      <section className="pb-12 pt-10 md:pb-16 md:pt-16">
        <div className="wrap journal">
          <div className="journal-label">
            <SectionLabel name="Research & notes" className="text-muted" />
          </div>
          <div className="journal-body">
            <Lines
              as="h1"
              auto
              className="t-h2"
              lines={[
                "What we’re learning",
                <>
                  about <em>doubt</em>.
                </>,
              ]}
            />
            <p className="t-lede load-in mt-6 max-w-[52ch] text-muted" style={{ ["--delay" as string]: "300ms" }}>
              Papers, technical notes, and essays on world models for physical design &mdash; and on knowing when not to
              trust them.
            </p>
          </div>
        </div>
      </section>

      {featured && (
        <section className="pb-12 md:pb-16" aria-labelledby="featured-h">
          <div className="wrap">
            <article className="reveal grid gap-4 lg:grid-cols-12">
              <Link href={`/research/${featured.slug}/`} className="lg:col-span-6" tabIndex={-1} aria-hidden="true">
                <ArtCard tone="paper" texture="grid" className="aspect-[4/3] h-full min-h-[280px]">
                  <PaperCover className="absolute inset-0 h-full w-full" />
                </ArtCard>
              </Link>
              <div className="card flex flex-col p-7 sm:p-10 lg:col-span-6">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="chip border-fg bg-fg text-white">Featured paper</span>
                  <span className="t-mono text-muted">
                    <time dateTime={featured.date}>{formatDate(featured.date)}</time>
                  </span>
                </div>
                <h2 id="featured-h" className="t-statement mt-8">
                  <Link href={`/research/${featured.slug}/`} className="hover:underline hover:decoration-1 hover:underline-offset-4">
                    {featured.title}
                  </Link>
                </h2>
                <p className="mt-5 max-w-[52ch] text-muted">{featured.dek}</p>
                <dl className="t-mono mt-8 grid grid-cols-[5.5rem_1fr] gap-y-1.5 text-[11px]">
                  {featured.authors && (
                    <>
                      <dt className="text-muted">Authors</dt>
                      <dd>{featured.authors}</dd>
                    </>
                  )}
                  {featured.venue && (
                    <>
                      <dt className="text-muted">Venue</dt>
                      <dd>{featured.venue}</dd>
                    </>
                  )}
                </dl>
                <div className="mt-auto flex flex-wrap items-center justify-between gap-4 pt-10">
                  <div className="flex flex-wrap gap-1.5">
                    {featured.tags.map((t) => (
                      <span key={t} className="chip">
                        {t}
                      </span>
                    ))}
                  </div>
                  <Pill href={`/research/${featured.slug}/`}>Read the paper</Pill>
                </div>
              </div>
            </article>
          </div>
        </section>
      )}

      {rest.length > 0 && (
        <section className="pb-16 md:pb-24" aria-labelledby="more-h">
          <div className="wrap">
            <h2 id="more-h" className="t-mono mb-6 text-muted">
              More notes
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {rest.map((p) => (
                <PostCard key={p.slug} post={p} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
