"use client";

import type { ReactNode } from "react";
import { Contours } from "./sims/Contours";

const TONES = {
  sand: { bg: "#ecd58f", line: "#8a6a1e" },
  copper: { bg: "#f3dccb", line: "#a4532a" },
  teal: { bg: "#1f4a46", line: "#7cc0a0" },
  sky: { bg: "#3d72ad", line: "#d6e2f1" },
  paper: { bg: "#f7f3e8", line: "#2e2e38" },
} as const;

/**
 * Illustration tile. Two quiet textures so the dithered clouds (hero, statement,
 * footer) stay special: topographic contours, or drafting-grid paper.
 */
export function ArtCard({
  tone = "sand",
  texture = "contours",
  seed = 1,
  className = "",
  children,
}: {
  tone?: keyof typeof TONES;
  texture?: "contours" | "grid";
  seed?: number;
  className?: string;
  children?: ReactNode;
}) {
  const t = TONES[tone];
  const grid =
    texture === "grid"
      ? {
          backgroundImage: `linear-gradient(rgba(61,114,173,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(61,114,173,0.18) 1px, transparent 1px), linear-gradient(rgba(61,114,173,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(61,114,173,0.08) 1px, transparent 1px)`,
          backgroundSize: "60px 60px, 60px 60px, 12px 12px, 12px 12px",
          backgroundPosition: "-1px -1px",
        }
      : {};
  return (
    <div className={`relative isolate overflow-hidden rounded-[20px] ${className}`} style={{ background: t.bg, ...grid }}>
      {texture === "contours" && <Contours className="absolute inset-0 -z-10" color={t.line} seed={seed} opacity={0.55} />}
      {children}
    </div>
  );
}
