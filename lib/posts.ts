import fs from "node:fs";
import path from "node:path";
import GithubSlugger from "github-slugger";
import type { ComponentType } from "react";

export type PostMeta = {
  title: string;
  date: string; // ISO yyyy-mm-dd
  dek: string;
  tags: string[];
  authors?: string;
  venue?: string;
  placeholder?: boolean;
  draft?: boolean;
  featured?: boolean;
};
export type Post = PostMeta & { slug: string };

const DIR = path.join(process.cwd(), "content/posts");

function allSlugs(): string[] {
  return fs
    .readdirSync(DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => f.replace(/\.mdx$/, ""));
}

/** Published slugs only — drafts (`draft: true` in meta) are skipped entirely. */
export function postSlugs(): string[] {
  return allSlugs().filter((s) => !/^\s*draft:\s*true/m.test(fs.readFileSync(path.join(DIR, `${s}.mdx`), "utf8")));
}

export async function loadPost(slug: string): Promise<{ meta: Post; Content: ComponentType }> {
  const mod = await import(`@/content/posts/${slug}.mdx`);
  return { meta: { ...(mod.meta as PostMeta), slug }, Content: mod.default };
}

export async function allPosts(): Promise<Post[]> {
  const posts = await Promise.all(postSlugs().map(async (s) => (await loadPost(s)).meta));
  return posts.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function formatDate(iso: string) {
  const d = new Date(iso + "T00:00:00Z");
  return d
    .toLocaleDateString("en-US", { year: "numeric", month: "short", day: "2-digit", timeZone: "UTC" })
    .toUpperCase();
}

/** `##` headings of a post, with the same ids rehype-slug gives them. */
export function postHeadings(slug: string): { id: string; text: string }[] {
  const src = fs.readFileSync(path.join(DIR, `${slug}.mdx`), "utf8");
  const slugger = new GithubSlugger();
  return [...src.matchAll(/^##\s+(.+)$/gm)].map((m) => {
    const text = m[1].replace(/[*_`]/g, "").trim();
    return { id: slugger.slug(text), text };
  });
}
