import Link from "next/link";
import type { ReactNode } from "react";

const Arrow = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <path d="M2 6h8M6.5 2.5 10 6l-3.5 3.5" stroke="currentColor" strokeWidth="1.4" />
  </svg>
);

/** Rounded pill with a circled arrow — the site's one button shape. */
export function Pill({
  href,
  children,
  tone = "dark",
  small = false,
  className = "",
}: {
  href: string;
  children: ReactNode;
  tone?: "dark" | "light";
  small?: boolean;
  className?: string;
}) {
  const cls = `pill ${tone} ${small ? "sm" : ""} ${className}`;
  const inner = (
    <>
      <span>{children}</span>
      <span className="pill-dot">
        <Arrow />
      </span>
    </>
  );
  return href.startsWith("/") || href.startsWith("#") ? (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  ) : (
    <a href={href} className={cls}>
      {inner}
    </a>
  );
}

/** Kept for existing pages: the primary action is a dark pill. */
export function Button({ href, children, small = false }: { href: string; children: ReactNode; small?: boolean }) {
  return (
    <Pill href={href} small={small}>
      {children}
    </Pill>
  );
}

export function TextLink({
  href,
  children,
  className = "",
}: {
  href: string;
  children: ReactNode;
  className?: string;
  external?: boolean;
}) {
  const inner = (
    <>
      <span>{children}</span>
      <span className="arrow" aria-hidden="true">
        →
      </span>
    </>
  );
  return href.startsWith("/") || href.startsWith("#") ? (
    <Link href={href} className={`link ${className}`}>
      {inner}
    </Link>
  ) : (
    <a href={href} className={`link ${className}`}>
      {inner}
    </a>
  );
}
