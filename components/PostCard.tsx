import Link from "next/link";
import { formatDate, type Post } from "@/lib/posts";

export function PostCard({ post }: { post: Post }) {
  return (
    <Link
      href={`/research/${post.slug}/`}
      className="reveal card group flex h-full flex-col p-6 transition-colors hover:border-line-strong sm:p-7"
    >
      <p className="t-mono text-muted">
        <time dateTime={post.date}>{formatDate(post.date)}</time>
      </p>
      <h3 className="t-h3 mt-6">{post.title}</h3>
      <p className="mt-3 text-[15px] leading-relaxed text-muted">{post.dek}</p>
      <div className="mt-auto flex items-end justify-between gap-4 pt-8">
        <div className="flex flex-wrap gap-1.5">
          {post.tags.map((t) => (
            <span key={t} className="chip">
              {t}
            </span>
          ))}
        </div>
        <span className="pill-dot grid h-8 w-8 place-items-center rounded-full border border-line text-muted transition-colors group-hover:border-fg group-hover:text-fg" aria-hidden="true">
          →
        </span>
      </div>
    </Link>
  );
}
