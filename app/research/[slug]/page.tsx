import type { Metadata } from "next";
import { ArtCard } from "@/components/ArtCard";
import { Pill } from "@/components/Button";
import { PaperCover } from "@/components/PaperCover";
import { Toc } from "@/components/Toc";
import { formatDate, loadPost, postHeadings, postSlugs } from "@/lib/posts";

export const dynamicParams = false;

export function generateStaticParams() {
  return postSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/research/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const { meta } = await loadPost(slug);
  return {
    title: meta.title,
    description: meta.dek,
    openGraph: { title: meta.title, description: meta.dek, type: "article" },
  };
}

export default async function PostPage({ params }: PageProps<"/research/[slug]">) {
  const { slug } = await params;
  const { meta, Content } = await loadPost(slug);
  return (
    <article className="pb-16 pt-10 md:pb-24 md:pt-16">
      <header className="wrap grid gap-4 lg:grid-cols-12">
        <div className="card flex flex-col p-7 sm:p-10 lg:col-span-7 lg:p-12">
          <div className="t-mono flex flex-wrap items-center gap-x-3 gap-y-1 text-muted">
            <span>{meta.featured ? "Paper" : "Note"}</span>
            <span aria-hidden="true">·</span>
            <time dateTime={meta.date}>{formatDate(meta.date)}</time>
            {meta.venue && (
              <>
                <span aria-hidden="true">·</span>
                <span>{meta.venue}</span>
              </>
            )}
          </div>
          <h1 className="t-h2 load-in mt-8 max-w-[18ch]">{meta.title}</h1>
          <p className="t-lede load-in mt-6 max-w-[56ch] text-muted" style={{ ["--delay" as string]: "120ms" }}>
            {meta.dek}
          </p>
          <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-3 pt-8">
            {meta.authors && <p className="text-[15px]">{meta.authors}</p>}
            <div className="flex flex-wrap gap-1.5">
              {meta.tags.map((t) => (
                <span key={t} className="chip">
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
        <ArtCard
          tone={meta.featured ? "paper" : "sand"}
          texture={meta.featured ? "grid" : "contours"}
          className="min-h-[240px] lg:col-span-5"
        >
          {meta.featured && <PaperCover className="absolute inset-0 h-full w-full" />}
        </ArtCard>
      </header>

      <div className="wrap journal mt-14 md:mt-20 lg:gap-y-0">
        <aside className="journal-label hidden lg:block">
          <div className="sticky top-28">
            <Toc items={postHeadings(slug)} />
          </div>
        </aside>
        <div className="journal-body">
          <div className="prose">
            <Content />
          </div>
          <div className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-8">
            <Pill href="/research/" tone="light">
              All research
            </Pill>
            <Pill href="/pilot/">Request a pilot</Pill>
          </div>
        </div>
      </div>
    </article>
  );
}
