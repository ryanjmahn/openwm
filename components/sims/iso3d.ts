/*
 * Tiny orthographic 3D for the illustration scenes (shared look with the hero):
 * yaw/pitch camera, painter-sorted convex objects, Lambert shading, ink edges.
 */
import { BAYER8 as BAYER8_, hex, rgba, type RGB } from "./color";
import type { Obj, V3 } from "./blueprint";

export const LIGHT: V3 = (() => {
  const v: V3 = [-0.45, -0.55, 0.7];
  const m = Math.hypot(...v);
  return [v[0] / m, v[1] / m, v[2] / m];
})();

export type Cam = {
  S: number;
  cx: number;
  cy: number;
  sp: number;
  cp: number;
  cyw: number;
  syw: number;
  proj: (x: number, y: number, z: number) => [number, number, number];
  view: V3;
};

export function camera(S: number, yaw: number, pitch: number, cx: number, cy: number): Cam {
  const sp = Math.sin(pitch);
  const cp = Math.cos(pitch);
  const cyw = Math.cos(yaw);
  const syw = Math.sin(yaw);
  return {
    S,
    cx,
    cy,
    sp,
    cp,
    cyw,
    syw,
    view: [syw * cp, cyw * cp, -sp],
    proj: (x, y, z) => {
      const xr = x * cyw - y * syw;
      const yr = x * syw + y * cyw;
      return [cx + S * xr, cy - S * (yr * sp + z * cp), yr * cp - z * sp];
    },
  };
}

const cache = new Map<string, { rgb: RGB; a: number }>();
export function parseColor(c: string) {
  let v = cache.get(c);
  if (!v) {
    if (c.startsWith("#")) v = { rgb: hex(c), a: 1 };
    else {
      const m = c.match(/[\d.]+/g)!.map(Number);
      v = { rgb: [m[0], m[1], m[2]], a: m[3] ?? 1 };
    }
    cache.set(c, v);
  }
  return v;
}
const mix = (a: RGB, b: RGB, k: number): RGB => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const shade = (c: RGB, s: number): RGB => [c[0] * s, c[1] * s, c[2] * s];

export type DrawOpts = {
  /** 0..1 blend of the face's field value through `cmap`. */
  field?: number;
  cmap?: (t: number) => RGB;
  /** Per-face tint (e.g. uncertainty) — returns [colour, amount]. */
  tint?: (f: Obj["faces"][number], o: Obj) => [RGB, number] | null;
  offset?: V3;
  alpha?: number;
  edge?: number;
  lineWidth?: number;
};

export function drawObjs(ctx: CanvasRenderingContext2D, cam: Cam, objs: Obj[], o: DrawOpts = {}) {
  const off = o.offset ?? [0, 0, 0];
  const vd = cam.view;
  const sorted = objs
    .map((ob) => ({ ob, d: cam.proj(ob.c[0] + off[0], ob.c[1] + off[1], ob.c[2] + off[2])[2] }))
    .sort((a, b) => a.ob.layer - b.ob.layer || b.d - a.d);
  for (const { ob } of sorted) {
    const { rgb, a } = parseColor(ob.mat);
    for (const f of ob.faces) {
      if (f.n[0] * vd[0] + f.n[1] * vd[1] + f.n[2] * vd[2] > 0.001) continue;
      ctx.beginPath();
      f.pts.forEach(([x, y, z], k) => {
        const p = cam.proj(x + off[0], y + off[1], z + off[2]);
        if (k) ctx.lineTo(p[0], p[1]);
        else ctx.moveTo(p[0], p[1]);
      });
      ctx.closePath();
      const lam = Math.max(0, f.n[0] * LIGHT[0] + f.n[1] * LIGHT[1] + f.n[2] * LIGHT[2]);
      let c = shade(rgb, 0.7 + 0.34 * lam);
      if (o.field && o.cmap) c = mix(c, shade(o.cmap(f.field), 0.84 + 0.2 * lam), o.field * 0.92);
      const t = o.tint?.(f, ob);
      if (t) c = mix(c, t[0], t[1]);
      ctx.fillStyle = rgba(c, a * (o.alpha ?? 1));
      ctx.fill();
      ctx.lineWidth = o.lineWidth ?? 1;
      ctx.strokeStyle = `rgba(46,46,56,${(o.edge ?? 0.55) * (o.alpha ?? 1)})`;
      ctx.stroke();
    }
  }
}

/** Ellipse (circle in a horizontal plane) as a projected polygon path. */
export function ringPath(ctx: CanvasRenderingContext2D, cam: Cam, x: number, y: number, z: number, r: number, n = 28) {
  ctx.beginPath();
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    const p = cam.proj(x + Math.cos(a) * r, y + Math.sin(a) * r, z);
    if (i) ctx.lineTo(p[0], p[1]);
    else ctx.moveTo(p[0], p[1]);
  }
  ctx.closePath();
}

/** Line between two 3D points. */
export function line3(ctx: CanvasRenderingContext2D, cam: Cam, a: V3, b: V3) {
  const p = cam.proj(...a);
  const q = cam.proj(...b);
  ctx.beginPath();
  ctx.moveTo(p[0], p[1]);
  ctx.lineTo(q[0], q[1]);
  ctx.stroke();
}

/**
 * Pixel/dither pass shared by the scenes: draw geometry into a low-res buffer
 * (1 texel per `cell` CSS px), ordered-dither every channel to a few levels,
 * then upscale without smoothing — the same texture as the "Built for" cards.
 */
export function makeDitherer() {
  const off = document.createElement("canvas");
  const g = off.getContext("2d", { willReadFrequently: true })!;
  let cell = 3;
  return {
    begin(W: number, H: number, c: number) {
      cell = c;
      const w = Math.max(1, Math.ceil(W / c));
      const h = Math.max(1, Math.ceil(H / c));
      if (off.width !== w || off.height !== h) {
        off.width = w;
        off.height = h;
      }
      g.setTransform(1 / c, 0, 0, 1 / c, 0, 0);
      g.clearRect(0, 0, W, H);
      return g;
    },
    end(ctx: CanvasRenderingContext2D, levels = 6) {
      const img = g.getImageData(0, 0, off.width, off.height);
      const d = img.data;
      const L = levels - 1;
      for (let y = 0; y < off.height; y++)
        for (let x = 0; x < off.width; x++) {
          const i = (y * off.width + x) * 4;
          const a = d[i + 3];
          if (!a) continue;
          const th = BAYER8_[(y & 7) * 8 + (x & 7)];
          if (a < 255) {
            if (a / 255 <= th) {
              d[i + 3] = 0;
              continue;
            }
            // un-premultiply is implicit in getImageData; just make it opaque
            d[i + 3] = 255;
          }
          for (let ch = 0; ch < 3; ch++) d[i + ch] = (Math.min(L, Math.floor((d[i + ch] / 255) * L + th)) / L) * 255;
        }
      g.putImageData(img, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(off, 0, 0, off.width * cell, off.height * cell);
    },
  };
}
