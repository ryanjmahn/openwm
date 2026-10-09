"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Pill } from "./Button";

const LINKS = [
  { href: "/#approach", label: "Approach" },
  { href: "/#built-for", label: "Built for" },
  { href: "/research/", label: "Research" },
  { href: "/about/", label: "About" },
  { href: "/careers/", label: "Careers" },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    sheetRef.current?.querySelector<HTMLElement>("a")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
      if (e.key === "Tab" && sheetRef.current) {
        const items = [toggleRef.current!, ...sheetRef.current.querySelectorAll<HTMLElement>("a")];
        const i = items.indexOf(document.activeElement as HTMLElement);
        const n = e.shiftKey ? (i <= 0 ? items.length - 1 : i - 1) : i === items.length - 1 ? 0 : i + 1;
        items[n]?.focus();
        e.preventDefault();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-50">
      <a
        href="#main"
        className="t-mono sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-full focus:bg-surface focus:px-4 focus:py-2"
      >
        Skip to content
      </a>
      <div
        className={`border-b transition-colors duration-300 ${
          scrolled || open ? "border-line bg-base/85 backdrop-blur-md" : "border-transparent bg-base"
        }`}
      >
        <nav className="wrap flex h-[72px] items-center justify-between gap-6" aria-label="Primary">
          <Link href="/" onClick={close} className="font-display text-[28px] leading-none tracking-[-0.02em]" aria-label="OpenWM home">
            OpenWM
          </Link>
          <div className="hidden items-center gap-8 md:flex">
            <ul className="t-mono flex items-center gap-7 text-[12px]">
              {LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="link text-muted transition-colors hover:text-fg">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
            <Pill href="/pilot/" small>
              Request a pilot
            </Pill>
          </div>
          <button
            ref={toggleRef}
            type="button"
            className="t-mono -mr-2 flex h-11 items-center gap-2 rounded-full px-3 md:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((o) => !o)}
          >
            <span>{open ? "Close" : "Menu"}</span>
            <span aria-hidden="true" className="relative block h-[9px] w-4">
              <span className={`absolute inset-x-0 top-0 h-px bg-fg transition-transform duration-300 ${open ? "translate-y-[4px] rotate-45" : ""}`} />
              <span className={`absolute inset-x-0 bottom-0 h-px bg-fg transition-transform duration-300 ${open ? "-translate-y-[4px] -rotate-45" : ""}`} />
            </span>
          </button>
        </nav>
      </div>

      <div id="mobile-menu" ref={sheetRef} hidden={!open} className="fixed inset-x-0 bottom-0 top-[72px] overflow-y-auto bg-base md:hidden">
        <div className="wrap flex min-h-full flex-col justify-between pb-10 pt-6">
          <ul className="border-t border-line">
            {[{ href: "/", label: "Home" }, ...LINKS].map((l, i) => (
              <li key={l.href} className="border-b border-line">
                <Link href={l.href} onClick={close} className="flex items-baseline justify-between py-4">
                  <span className="font-display text-[42px] leading-none">{l.label}</span>
                  <span className="t-mono text-muted">0{i + 1}</span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-10" onClick={close}>
            <Pill href="/pilot/" className="w-full justify-between">
              Request a pilot
            </Pill>
          </div>
        </div>
      </div>
    </header>
  );
}
