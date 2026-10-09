"use client";

import { useEffect, useRef } from "react";

export type Env = {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  w: number;
  h: number;
  dpr: number;
  reduced: boolean;
  mono: string;
};

export type Sim = {
  /** Called after every resize (w/h/dpr already updated). */
  resize?: () => void;
  /** Draw one frame. `t` is ms since mount, `dt` ms since last frame. */
  frame: (t: number, dt: number) => void;
  dispose?: () => void;
};

/**
 * Shared canvas runner: DPR-aware sizing, ResizeObserver, pauses off-screen and
 * in background tabs, and draws a single still frame under reduced motion.
 */
export function useCanvasSim<T extends HTMLElement = HTMLDivElement>(
  setup: (env: Env) => Sim,
  deps: unknown[] = [],
  opts: { maxDpr?: number } = {},
) {
  const wrapRef = useRef<T>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const env: Env = {
      canvas,
      ctx,
      w: 1,
      h: 1,
      dpr: 1,
      reduced,
      mono: getComputedStyle(document.body).getPropertyValue("--font-mono") || "monospace",
    };
    // next/font exposes the family via the CSS variable on <html>
    env.mono = getComputedStyle(document.documentElement).getPropertyValue("--font-departure").trim() || "monospace";

    const sim = setup(env);
    let raf = 0;
    let visible = false;
    let last = 0;
    let clock = 0; // only advances while running

    const paint = (dt: number) => {
      ctx.setTransform(env.dpr, 0, 0, env.dpr, 0, 0);
      sim.frame(clock, dt);
    };
    const tick = (now: number) => {
      const dt = last ? Math.min(48, now - last) : 16;
      last = now;
      clock += dt;
      paint(dt);
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      if (raf || reduced || !visible || document.hidden) return;
      last = 0;
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };
    const resize = () => {
      const r = wrap.getBoundingClientRect();
      env.dpr = Math.min(opts.maxDpr ?? 2, window.devicePixelRatio || 1);
      env.w = Math.max(1, Math.round(r.width));
      env.h = Math.max(1, Math.round(r.height));
      canvas.width = Math.round(env.w * env.dpr);
      canvas.height = Math.round(env.h * env.dpr);
      sim.resize?.();
      if (!raf) paint(0);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    const io = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting;
        if (visible) start();
        else stop();
      },
      { rootMargin: "100px" },
    );
    io.observe(wrap);
    const onVis = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVis);

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      sim.dispose?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { wrapRef, canvasRef };
}
