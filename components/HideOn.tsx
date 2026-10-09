"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** Renders children everywhere except the given route. */
export function HideOn({ path, children }: { path: string; children: ReactNode }) {
  const p = usePathname();
  const norm = (s: string) => s.replace(/\/$/, "");
  return norm(p ?? "") === norm(path) ? null : <>{children}</>;
}
