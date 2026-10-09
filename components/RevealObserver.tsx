"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const SELECTOR = ".reveal, .reveal-rule, .lines-reveal";

/**
 * One IntersectionObserver for the whole page: adds `.in` once an element enters.
 * Siblings revealed in the same frame are staggered 60ms apart.
 */
export function RevealObserver() {
  const pathname = usePathname();
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        let i = 0;
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const el = e.target as HTMLElement;
          if (!el.style.getPropertyValue("--delay") && el.classList.contains("reveal")) {
            el.style.setProperty("--delay", `${i++ * 60}ms`);
          }
          el.classList.add("in");
          io.unobserve(el);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.01 },
    );
    document.querySelectorAll(SELECTOR).forEach((el) => {
      if (!el.classList.contains("in")) io.observe(el);
    });
    return () => io.disconnect();
  }, [pathname]);
  return null;
}
