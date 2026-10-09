import Link from "next/link";

export default function NotFound() {
  return (
    <section className="flex min-h-[80vh] items-center pb-24 pt-10">
      <div className="wrap">
        <p className="t-mono text-muted">Error 404 · confidence 0.07</p>
        <h1 className="t-h2 load-in mt-8 max-w-[16ch]">
          This page is outside the training <em>distribution</em>.
        </h1>
        <Link href="/" className="link t-mono mt-12 text-fg">
          route: VERIFY → home
        </Link>
      </div>
    </section>
  );
}
