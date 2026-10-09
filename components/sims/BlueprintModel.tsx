"use client";

import { useRef, useState } from "react";
import { BAYER8, fbm, hex, pressureMap, rgba, thermalMap, type RGB } from "./color";
import { makeDesign, type Design, type Obj, type V3 } from "./blueprint";
import { useCanvasSim } from "./useCanvasSim";

/*
 * Hero: a drafting table. A blueprint inks itself in, the part extrudes into a
 * 3D model, a quick simulation runs (particles + colour field), the model
 * reports a prediction and its confidence — then dissolves into the next design.
 */

const T_DRAFT = 2600;
const T_EXTRUDE = 1900;
const T_SIM = 4400;
const T_DISSOLVE = 1100;
const CYCLE = T_DRAFT + T_EXTRUDE + T_SIM + T_DISSOLVE;
const THRESHOLD = 0.85;

const SHEET = { x0: -4.3, y0: -2.75, x1: 4.3, y1: 3.15 };

type Phase = "draft" | "extrude" | "simulate" | "verify" | "dissolve";
type Hud = { title: string; dwg: string; phase: Phase; label: string; value: string; conf: string; route: "PREDICT" | "VERIFY" };

const ease = (k: number) => {
  const x = Math.min(1, Math.max(0, k));
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const shadeRGB = (c: RGB, s: number): RGB => [c[0] * s, c[1] * s, c[2] * s];
const mix = (a: RGB, b: RGB, k: number): RGB => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];

function parseColor(c: string): { rgb: RGB; a: number } {
  if (c.startsWith("#")) return { rgb: hex(c), a: 1 };
  const m = c.match(/[\d.]+/g)!.map(Number);
  return { rgb: [m[0], m[1], m[2]], a: m[3] ?? 1 };
}

const LIGHT: V3 = (() => {
  const v: V3 = [-0.45, -0.55, 0.7];
  const m = Math.hypot(...v);
  return [v[0] / m, v[1] / m, v[2] / m];
})();

/** `className` sizes the canvas box (e.g. an aspect ratio); the phone caption sits below it. */
export function BlueprintModel({ className = "" }: { className?: string }) {
  const [hud, setHud] = useState<Hud | null>(null);
  const pointer = useRef({ x: 0, tx: 0 });

  const { wrapRef, canvasRef } = useCanvasSim((env) => {
    const { ctx } = env;
    let index = 0;
    let design: Design = makeDesign(0);
    let cycleStart = 0;
    let lastPhase: Phase | null = null;

    // Dithered soft shadow (drawn under the model in table space).
    const shadow = document.createElement("canvas");
    shadow.width = shadow.height = 48;
    {
      const s = shadow.getContext("2d")!;
      const img = s.createImageData(48, 48);
      for (let y = 0; y < 48; y++)
        for (let x = 0; x < 48; x++) {
          const d = Math.hypot((x - 23.5) / 24, (y - 23.5) / 24);
          const v = Math.max(0, 1 - d) ** 1.4;
          const on = v > BAYER8[(y & 7) * 8 + (x & 7)];
          const i = (y * 48 + x) * 4;
          img.data[i] = 46;
          img.data[i + 1] = 46;
          img.data[i + 2] = 56;
          img.data[i + 3] = on ? 255 : 0;
        }
      s.putImageData(img, 0, 0);
    }

    // Blueprint sheet as a dithered texture (20 texels per unit) so it reads like the clouds behind it.
    const sheetTex = document.createElement("canvas");
    {
      const TX = 20;
      const pad = 0.9;
      const w = Math.round((SHEET.x1 - SHEET.x0 + pad * 2) * TX);
      const h = Math.round((SHEET.y1 - SHEET.y0 + pad * 2) * TX);
      sheetTex.width = w;
      sheetTex.height = h;
      const g = sheetTex.getContext("2d")!;
      const img = g.createImageData(w, h);
      const deep = hex("#3d72ad");
      const mid = hex("#7fa3d0");
      const pale = hex("#c4d5ea");
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          // signed distance (units) inside the sheet rectangle
          const ux = x / TX - pad;
          const uy = y / TX - pad;
          const d = Math.min(ux, uy, SHEET.x1 - SHEET.x0 - ux, SHEET.y1 - SHEET.y0 - uy);
          const n = fbm(x * 0.09, y * 0.09, 5, 3) - 0.5;
          const v = (d + 0.55 + n * 0.9) / 0.9; // 1 inside, 0 outside, ragged band
          const th = BAYER8[(y & 7) * 8 + (x & 7)];
          const i = (y * w + x) * 4;
          let c: RGB | null = null;
          if (v > 1 + th * 0.6) c = deep;
          else if (v > 0.5 + th * 0.5) c = mid;
          else if (v > th * 0.7) c = pale;
          if (c) {
            img.data[i] = c[0];
            img.data[i + 1] = c[1];
            img.data[i + 2] = c[2];
            img.data[i + 3] = 255;
          }
        }
      g.putImageData(img, 0, 0);
    }

    // Particles
    const N = 520;
    const P = {
      x: new Float32Array(N),
      y: new Float32Array(N),
      z: new Float32Array(N),
      vx: new Float32Array(N),
      vy: new Float32Array(N),
      vz: new Float32Array(N),
      z0: new Float32Array(N),
      age: new Float32Array(N),
      life: new Float32Array(N),
      kind: new Uint8Array(N), // 0 dead, 1 sim, 2 burst
      col: new Array<string>(N).fill(""),
    };
    let cursor = 0;
    const spawn = (x: number, y: number, z: number, vx: number, vy: number, vz: number, life: number, kind: number, col = "") => {
      const i = cursor;
      cursor = (cursor + 1) % N;
      P.x[i] = x;
      P.y[i] = y;
      P.z[i] = z;
      P.z0[i] = z;
      P.vx[i] = vx;
      P.vy[i] = vy;
      P.vz[i] = vz;
      P.age[i] = 0;
      P.life[i] = life;
      P.kind[i] = kind;
      P.col[i] = col;
    };

    // Camera state (recomputed each frame)
    let S = 40;
    let yaw = 0.6;
    let sp = 1;
    let cp = 0;
    let cyw = 1;
    let syw = 0;
    let cx = 0;
    let cy0 = 0;
    const proj = (x: number, y: number, z: number): [number, number, number] => {
      const xr = x * cyw - y * syw;
      const yr = x * syw + y * cyw;
      return [cx + S * xr, cy0 - S * (yr * sp + z * cp), yr * cp - z * sp];
    };
    const viewDir = (): V3 => [syw * cp, cyw * cp, -sp]; // into the scene, world frame
    const plane = (z = 0) => {
      const d = env.dpr;
      ctx.setTransform(d * S * cyw, d * -S * sp * syw, d * -S * syw, d * -S * sp * cyw, d * cx, d * (cy0 - S * z * cp));
    };
    const screen = () => ctx.setTransform(env.dpr, 0, 0, env.dpr, 0, 0);
    const textAt = (s: string, x: number, y: number, size: number, align: CanvasTextAlign = "left") => {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(size / 20, -size / 20);
      ctx.font = `20px ${env.mono}`;
      ctx.textAlign = align;
      ctx.fillText(s, 0, 0);
      ctx.restore();
    };

    const polyPath = (pts: [number, number][]) => {
      ctx.beginPath();
      pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.closePath();
    };

    /* ---------- drawing ---------- */
    function drawSheet(progress: number, ink: number) {
      const { x0, y0, x1, y1 } = SHEET;
      plane(0.002);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(sheetTex, x0 - 0.9, y0 - 0.9, x1 - x0 + 1.8, y1 - y0 + 1.8);
      ctx.lineWidth = 0.6 / S;
      ctx.strokeStyle = "rgba(255,255,255,0.09)";
      ctx.beginPath();
      for (let x = Math.ceil(x0 * 4) / 4; x < x1; x += 0.25) {
        ctx.moveTo(x, y0);
        ctx.lineTo(x, y1);
      }
      for (let y = Math.ceil(y0 * 4) / 4; y < y1; y += 0.25) {
        ctx.moveTo(x0, y);
        ctx.lineTo(x1, y);
      }
      ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,0.55)";
      ctx.lineWidth = 1 / S;
      ctx.strokeRect(x0 + 0.18, y0 + 0.18, x1 - x0 - 0.36, y1 - y0 - 0.36);

      // title block
      const tb = { x0: x1 - 2.75, y0: y0 + 0.18, x1: x1 - 0.18, y1: y0 + 1.05 };
      ctx.strokeRect(tb.x0, tb.y0, tb.x1 - tb.x0, tb.y1 - tb.y0);
      ctx.beginPath();
      ctx.moveTo(tb.x0, tb.y0 + 0.42);
      ctx.lineTo(tb.x1, tb.y0 + 0.42);
      ctx.moveTo(tb.x0 + 1.15, tb.y0);
      ctx.lineTo(tb.x0 + 1.15, tb.y0 + 0.42);
      ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      textAt("OPENWM · " + design.dwg, tb.x0 + 0.1, tb.y1 - 0.3, 0.17);
      textAt("SCALE 1:2", tb.x0 + 0.1, tb.y0 + 0.14, 0.14);
      textAt(design.title.toUpperCase(), tb.x0 + 1.25, tb.y0 + 0.14, 0.14);

      // linework, drawn progressively
      const lines = design.plan;
      let total = 0;
      const lens = lines.map((p) => {
        let l = 0;
        for (let i = 0; i < p.length; i++) {
          const a = p[i];
          const b = p[(i + 1) % p.length];
          l += Math.hypot(b[0] - a[0], b[1] - a[1]);
        }
        total += l;
        return l;
      });
      let budget = progress * total;
      ctx.save();
      ctx.translate(0, 0.25);
      ctx.strokeStyle = `rgba(255,255,255,${0.95 * ink})`;
      ctx.lineWidth = 1.3 / S;
      lines.forEach((p, k) => {
        if (budget <= 0) return;
        ctx.beginPath();
        ctx.moveTo(p[0][0], p[0][1]);
        let left = Math.min(budget, lens[k]);
        budget -= lens[k];
        for (let i = 0; i < p.length && left > 0; i++) {
          const a = p[i];
          const b = p[(i + 1) % p.length];
          const l = Math.hypot(b[0] - a[0], b[1] - a[1]);
          const f = Math.min(1, left / l);
          ctx.lineTo(a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f);
          left -= l;
        }
        ctx.stroke();
      });

      // centre lines + dimensions fade in at the end of the draft
      const dimA = Math.min(1, Math.max(0, (progress - 0.7) / 0.3)) * ink;
      if (dimA > 0) {
        const { w, d, wLabel, dLabel, x0: dx, y0: dy } = design.dims;
        ctx.strokeStyle = `rgba(255,255,255,${0.5 * dimA})`;
        ctx.setLineDash([0.18, 0.08, 0.04, 0.08]);
        ctx.beginPath();
        ctx.moveTo(dx - 0.3, dy + d / 2);
        ctx.lineTo(dx + w + 0.3, dy + d / 2);
        ctx.moveTo(dx + w / 2, dy - 0.3);
        ctx.lineTo(dx + w / 2, dy + d + 0.3);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.strokeStyle = `rgba(255,255,255,${0.8 * dimA})`;
        const yy = dy - 0.42;
        const xx = dx - 0.42;
        ctx.beginPath();
        ctx.moveTo(dx, yy);
        ctx.lineTo(dx + w, yy);
        ctx.moveTo(dx, yy - 0.1);
        ctx.lineTo(dx, yy + 0.1);
        ctx.moveTo(dx + w, yy - 0.1);
        ctx.lineTo(dx + w, yy + 0.1);
        ctx.moveTo(xx, dy);
        ctx.lineTo(xx, dy + d);
        ctx.moveTo(xx - 0.1, dy);
        ctx.lineTo(xx + 0.1, dy);
        ctx.moveTo(xx - 0.1, dy + d);
        ctx.lineTo(xx + 0.1, dy + d);
        ctx.stroke();
        ctx.fillStyle = `rgba(255,255,255,${0.9 * dimA})`;
        textAt(wLabel, dx + w / 2, yy - 0.24, 0.17, "center");
        ctx.save();
        ctx.translate(xx - 0.14, dy + d / 2);
        ctx.rotate(Math.PI / 2);
        textAt(dLabel, 0, 0, 0.17, "center");
        ctx.restore();

        // detail view, top-left corner
        ctx.save();
        ctx.translate(SHEET.x0 + 0.45, SHEET.y1 - 1.75);
        ctx.strokeStyle = `rgba(255,255,255,${0.75 * dimA})`;
        ctx.lineWidth = 1 / S;
        for (const p of design.detail) {
          polyPath(p);
          ctx.stroke();
        }
        ctx.fillStyle = `rgba(255,255,255,${0.75 * dimA})`;
        textAt(design.detailLabel, 0, -0.3, 0.14);
        ctx.restore();
      }
      ctx.restore();
    }

    function drawShadow(alpha: number) {
      if (alpha <= 0) return;
      plane(0.004);
      const { w, d, x0, y0 } = design.dims;
      ctx.imageSmoothingEnabled = false;
      ctx.globalAlpha = alpha;
      const pad = 1.1;
      ctx.drawImage(shadow, x0 - pad + 0.35, y0 - pad + 0.25 - 0.3, w + pad * 2, d + pad * 2);
      ctx.globalAlpha = 1;
    }

    const toScreen = (o: Obj, e: number, offY: number) =>
      o.faces.map((f) => f.pts.map(([x, y, z]) => proj(x, y + offY, z * e)));

    function drawObjects(objs: Obj[], e: number, solid: number, field: number, offY: number, cmap: (t: number) => RGB, verifyGlow: number) {
      const vd = viewDir();
      const sorted = objs
        .map((o) => ({ o, d: proj(o.c[0], o.c[1] + offY, o.c[2] * e)[2] }))
        .sort((a, b) => a.o.layer - b.o.layer || b.d - a.d);
      screen();
      for (const { o } of sorted) {
        const { rgb, a } = parseColor(o.mat);
        const proj2 = toScreen(o, e, offY);
        o.faces.forEach((f, i) => {
          if (f.n[0] * vd[0] + f.n[1] * vd[1] + f.n[2] * vd[2] > 0.001) return; // back-face cull
          const pts = proj2[i];
          ctx.beginPath();
          pts.forEach(([x, y], k) => (k ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
          ctx.closePath();
          if (solid > 0) {
            const lam = Math.max(0, f.n[0] * LIGHT[0] + f.n[1] * LIGHT[1] + f.n[2] * LIGHT[2]);
            let c = shadeRGB(rgb, 0.7 + 0.34 * lam);
            if (field > 0) c = mix(c, shadeRGB(cmap(f.field), 0.82 + 0.22 * lam), field * 0.9);
            if (verifyGlow > 0) c = mix(c, [46, 91, 255], verifyGlow * 0.35 * (0.6 + 0.4 * lam));
            ctx.fillStyle = rgba(c, a * solid);
            ctx.fill();
          }
          ctx.lineWidth = 1;
          ctx.strokeStyle = solid > 0.5 ? `rgba(46,46,56,${0.55 * solid})` : `rgba(255,255,255,${0.9 * (1 - solid)})`;
          ctx.stroke();
        });
      }
    }

    function drawProps(e: number, t: number, offY: number) {
      if (!design.props || e < 0.6) return;
      const a = (e - 0.6) / 0.4;
      screen();
      for (const [px, py, pz] of design.props) {
        const ring: [number, number][] = [];
        for (let i = 0; i < 28; i++) {
          const th = (i / 28) * Math.PI * 2;
          const p = proj(px + Math.cos(th) * 0.85, py + offY + Math.sin(th) * 0.85, pz * e);
          ring.push([p[0], p[1]]);
        }
        ctx.beginPath();
        ring.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
        ctx.closePath();
        ctx.fillStyle = `rgba(46,46,56,${0.06 * a})`;
        ctx.fill();
        ctx.strokeStyle = `rgba(46,46,56,${0.22 * a})`;
        ctx.stroke();
        for (let k = 0; k < 3; k++) {
          const th = t * 0.03 - k * 0.12;
          const p0 = proj(px + Math.cos(th) * 0.82, py + offY + Math.sin(th) * 0.82, pz * e);
          const p1 = proj(px - Math.cos(th) * 0.82, py + offY - Math.sin(th) * 0.82, pz * e);
          ctx.strokeStyle = `rgba(46,46,56,${(0.7 - k * 0.22) * a})`;
          ctx.lineWidth = 2 - k * 0.5;
          ctx.beginPath();
          ctx.moveTo(p0[0], p0[1]);
          ctx.lineTo(p1[0], p1[1]);
          ctx.stroke();
        }
      }
    }

    function stepParticles(dt: number, simOn: number) {
      const s = dt / 1000;
      const k = design.kind;
      // spawn
      if (simOn > 0.05) {
        const rate = Math.round(9 * simOn);
        for (let i = 0; i < rate; i++) {
          if (k === "heatsink") {
            const { w, d } = design.dims;
            spawn((Math.random() - 0.5) * w * 0.9, (Math.random() - 0.5) * d, 0.4 + Math.random() * 0.3, 0, 0, 0.9 + Math.random() * 0.6, 1.6 + Math.random(), 1);
          } else if (k === "drone" && design.props) {
            const [px, py, pz] = design.props[Math.floor(Math.random() * 4)];
            const a = Math.random() * Math.PI * 2;
            const r = Math.sqrt(Math.random()) * 0.82;
            spawn(px + Math.cos(a) * r, py + Math.sin(a) * r, pz, -Math.sin(a) * 1.2, Math.cos(a) * 1.2, -2.4, 1.4 + Math.random() * 0.6, 1);
          } else if (k === "wing") {
            spawn(-5.2, (Math.random() - 0.5) * 4.4, 0.25 + Math.random() * 1.9, 3.1, 0, 0, 3.4, 1);
          }
        }
      }
      for (let i = 0; i < N; i++) {
        if (!P.kind[i]) continue;
        P.age[i] += s;
        if (P.age[i] > P.life[i]) {
          P.kind[i] = 0;
          continue;
        }
        if (P.kind[i] === 2) {
          P.vz[i] -= 2.5 * s;
          P.x[i] += P.vx[i] * s;
          P.y[i] += P.vy[i] * s;
          P.z[i] = Math.max(0, P.z[i] + P.vz[i] * s);
          continue;
        }
        if (k === "heatsink") {
          P.vz[i] += 0.6 * s;
          P.x[i] += Math.sin(P.age[i] * 3 + i) * 0.25 * s;
          P.z[i] += P.vz[i] * s;
        } else if (k === "drone") {
          P.x[i] += P.vx[i] * s;
          P.y[i] += P.vy[i] * s;
          P.z[i] += P.vz[i] * s;
          if (P.z[i] < 0.04) {
            // ground effect: spread outward along the table
            P.z[i] = 0.04;
            const r = Math.hypot(P.x[i], P.y[i]) || 1;
            P.vx[i] = (P.x[i] / r) * 1.8;
            P.vy[i] = (P.y[i] / r) * 1.8;
            P.vz[i] = 0;
          }
        } else if (k === "wing") {
          P.x[i] += P.vx[i] * s;
          const x = P.x[i];
          const zc = 1.05;
          const side = P.z0[i] > zc ? 1 : -1;
          const near = Math.exp(-Math.abs(P.z0[i] - zc) / 0.55);
          const bump = Math.exp(-((x + 0.1) ** 2) / 1.1) * 0.42 * near * side;
          const wash = x > 0 ? -0.18 * near * Math.min(1, x / 2.5) : 0;
          P.z[i] = P.z0[i] + bump + wash;
          P.vx[i] = 3.1 * (1 + (side > 0 ? 0.35 : -0.25) * near * Math.exp(-(x * x) / 1.2));
        }
      }
    }

    function drawParticles(offY: number, behind: boolean, refDepth: number) {
      screen();
      const k = design.kind;
      for (let i = 0; i < N; i++) {
        if (!P.kind[i]) continue;
        const [sx, sy, d] = proj(P.x[i], P.y[i] + offY, P.z[i]);
        if (behind !== d > refDepth) continue;
        const life = P.age[i] / P.life[i];
        const fade = Math.min(1, P.age[i] * 6) * (1 - life);
        let c: RGB;
        if (P.kind[i] === 2) c = hex(P.col[i] || "#2e2e38");
        else if (k === "heatsink") c = thermalMap(0.95 - life * 0.75);
        else if (k === "drone") c = pressureMap(0.08 + life * 0.25);
        else c = pressureMap(P.vx[i] > 3.3 ? 0.12 : P.vx[i] < 2.9 ? 0.85 : 0.35);
        ctx.fillStyle = rgba(c, fade);
        const sz = P.kind[i] === 2 ? 3 : 2.5;
        ctx.fillRect(Math.round(sx), Math.round(sy), sz, sz);
      }
    }

    /* ---------- timeline ---------- */
    const offY = 0.25;
    const pushHud = (phase: Phase) => {
      const verify = design.conf < THRESHOLD;
      const m = design.metric;
      const shown = phase === "draft" || phase === "extrude" ? "—" : `${m.value.toFixed(m.digits)}${m.unit ? " " + m.unit : ""}`;
      setHud({
        title: design.title,
        dwg: design.dwg,
        phase,
        label: m.label,
        value: shown,
        conf: phase === "draft" || phase === "extrude" ? "—" : design.conf.toFixed(2),
        route: verify ? "VERIFY" : "PREDICT",
      });
    };

    return {
      frame(t, dt) {
        const { w: W, h: H } = env;
        if (env.reduced) t = T_DRAFT + T_EXTRUDE + 1800;
        let local = t - cycleStart;
        if (local >= CYCLE) {
          cycleStart = t;
          local = 0;
          index += 1;
          design = makeDesign(index);
        }
        const verify = design.conf < THRESHOLD;
        let phase: Phase;
        if (local < T_DRAFT) phase = "draft";
        else if (local < T_DRAFT + T_EXTRUDE) phase = "extrude";
        else if (local < T_DRAFT + T_EXTRUDE + T_SIM) phase = verify && local < T_DRAFT + T_EXTRUDE + 2400 ? "verify" : "simulate";
        else phase = "dissolve";
        if (phase !== lastPhase) {
          if (phase === "dissolve") {
            // burst the model into particles
            for (const o of design.objs)
              for (const f of o.faces)
                for (let k = 0; k < 2; k++)
                  spawn(f.c[0], f.c[1], f.c[2], (Math.random() - 0.5) * 2.4, (Math.random() - 0.5) * 2.4, Math.random() * 2.2, 0.9 + Math.random() * 0.5, 2, o.mat.startsWith("#") ? o.mat : "#2f9c8f");
          }
          lastPhase = phase;
          pushHud(phase);
        }

        const kDraft = Math.min(1, local / (T_DRAFT * 0.92));
        const kExt = ease((local - T_DRAFT) / T_EXTRUDE);
        const kDis = ease((local - (CYCLE - T_DISSOLVE)) / T_DISSOLVE);
        const lift = phase === "dissolve" ? 1 - kDis : kExt; // 0 = flat blueprint, 1 = 3D
        const e = phase === "draft" ? 0 : phase === "dissolve" ? Math.max(0, 1 - kDis * 1.6) : kExt;
        const solid = Math.min(1, Math.max(0, (e - 0.2) / 0.5));
        const simK = phase === "simulate" || phase === "verify" ? Math.min(1, (local - T_DRAFT - T_EXTRUDE) / 700) : phase === "dissolve" ? Math.max(0, 1 - kDis * 2) : 0;

        // camera
        pointer.current.x += (pointer.current.tx - pointer.current.x) * 0.05;
        yaw = 0.62 + 0.22 * Math.sin(t / 6500) + pointer.current.x * 0.35;
        const pitch = lerp(1.32, 0.64, lift);
        sp = Math.sin(pitch);
        cp = Math.cos(pitch);
        cyw = Math.cos(yaw);
        syw = Math.sin(yaw);
        const sDraft = Math.min(W / 11.8, H / 8.8);
        const sModel = Math.min(W / 12.6, H / 9.6);
        S = lerp(sDraft, sModel, lift);
        cx = W / 2;
        cy0 = lerp(H * 0.5, H * 0.56, lift);

        ctx.clearRect(0, 0, W, H);
        drawSheet(phase === "draft" ? kDraft : 1, phase === "dissolve" ? 1 : Math.max(0.35, 1 - solid * 0.55));
        drawShadow(0.22 * solid);

        if (!env.reduced) stepParticles(dt, simK);
        const ref = proj(0, offY, design.height * 0.5)[2];
        if (!env.reduced) drawParticles(offY, true, ref);
        if (e > 0.001) {
          const cmap = design.kind === "heatsink" ? thermalMap : design.kind === "drone" ? thermalMap : pressureMap;
          const glow = phase === "verify" ? 0.5 + 0.5 * Math.sin(local / 140) : 0;
          drawObjects(design.objs, e, solid, simK, offY, cmap, glow);
          drawProps(e, t, offY);
        }
        if (!env.reduced) drawParticles(offY, false, ref);
      },
    };
  }, []);

  const steps: { key: Phase[]; label: string }[] = [
    { key: ["draft"], label: "Draft" },
    { key: ["extrude"], label: "Model" },
    { key: ["simulate", "verify"], label: "Simulate" },
    { key: ["dissolve"], label: "Next" },
  ];

  return (
    <div>
      <div
        ref={wrapRef}
        className={`relative w-full touch-pan-y ${className}`}
        onPointerMove={(e) => {
          if (e.pointerType !== "mouse") return;
          const r = e.currentTarget.getBoundingClientRect();
          pointer.current.tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
        }}
        onPointerLeave={() => (pointer.current.tx = 0)}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full"
          role="img"
          aria-label="Animation: on a drafting table, a blueprint of a part is drawn, then extruded into a 3D model. A short simulation runs — particles show heat or airflow — and the model reports a predicted result with its confidence. Low-confidence designs are flagged for a real test. Then the next design is drawn."
        />
        {hud && (
          <div className="pointer-events-none absolute left-0 top-0 hidden max-w-[78%] sm:left-2 sm:top-2 sm:block" aria-hidden="true">
            <div className="rounded-xl border border-line bg-surface/90 px-3 py-2.5 backdrop-blur-sm sm:px-4 sm:py-3">
              <p className="t-mono text-[10px] text-muted">{hud.dwg}</p>
              <p className="font-display text-[19px] leading-tight sm:text-[22px]">{hud.title}</p>
              <ol className="t-mono mt-2 flex gap-2.5 text-[9px] sm:text-[10px]">
                {steps.map((s) => (
                  <li key={s.label} className={s.key.includes(hud.phase) ? "text-fg" : "text-faint"}>
                    {s.key.includes(hud.phase) ? "● " : "○ "}
                    {s.label}
                  </li>
                ))}
              </ol>
              <div className="t-mono mt-2 grid grid-cols-[auto_auto] gap-x-3 text-[10px] sm:text-[11px]">
                <span className="text-muted">{hud.label}</span>
                <span className="tabular-nums">{hud.value}</span>
                <span className="text-muted">Confidence</span>
                <span className="tabular-nums">{hud.conf}</span>
                <span className="text-muted">Route</span>
                <span className={hud.route === "VERIFY" && hud.conf !== "—" ? "text-blue" : ""}>
                  {hud.conf === "—" ? "—" : hud.route === "VERIFY" ? (hud.phase === "verify" ? "Verify → running test" : "Verified ✓") : "Predict"}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
      {hud && (
        <div className="t-mono mt-1 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[10px] sm:hidden" aria-hidden="true">
          <span className="text-fg">
            {hud.dwg} · {hud.title}
          </span>
          <span className="text-muted">
            {hud.label} <span className="text-fg">{hud.value}</span> · conf{" "}
            <span className={hud.route === "VERIFY" && hud.conf !== "—" ? "text-blue" : "text-fg"}>{hud.conf}</span>
          </span>
        </div>
      )}
    </div>
  );
}
