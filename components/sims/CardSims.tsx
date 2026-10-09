"use client";

import { BAYER8, fbm, hex, rgba, terrainMap, type RGB } from "./color";
import { useCanvasSim } from "./useCanvasSim";

/* Small ambient simulations for the "Built for" cards. */

/** Propeller seen from above: tip vortices shed as spiralling particles. */
export function PropWake({ className = "", color = "#f7efdc" }: { className?: string; color?: string }) {
  const { wrapRef, canvasRef } = useCanvasSim((env) => {
    const { ctx } = env;
    const N = 420;
    const px = new Float32Array(N);
    const py = new Float32Array(N);
    const age = new Float32Array(N).fill(99);
    const r0 = new Float32Array(N);
    const a0 = new Float32Array(N);
    let k = 0;
    const c: RGB = hex(color);
    return {
      frame(t, dt) {
        const { w: W, h: H } = env;
        const cx = W / 2;
        const cy = H * 0.42;
        const R = Math.min(W, H) * 0.26;
        const rot = t * 0.012;
        ctx.clearRect(0, 0, W, H);
        // shed particles from the blade tips
        if (!env.reduced)
          for (let b = 0; b < 2; b++)
            for (let n = 0; n < 3; n++) {
              const a = rot + b * Math.PI + (Math.random() - 0.5) * 0.2;
              r0[k] = R * (0.92 + Math.random() * 0.1);
              a0[k] = a;
              age[k] = 0;
              k = (k + 1) % N;
            }
        for (let i = 0; i < N; i++) {
          if (age[i] > 3) continue;
          age[i] += dt / 1000;
          const r = r0[i] * (1 + age[i] * 0.55);
          const a = a0[i] - age[i] * 1.6;
          px[i] = cx + Math.cos(a) * r;
          py[i] = cy + Math.sin(a) * r * 0.42 + age[i] * H * 0.17;
          const f = 1 - age[i] / 3;
          ctx.fillStyle = rgba(c, 0.85 * f);
          ctx.fillRect(Math.round(px[i]), Math.round(py[i]), 2, 2);
        }
        // hub + blades (ellipse = disc seen at an angle)
        ctx.strokeStyle = rgba(c, 0.35);
        ctx.beginPath();
        ctx.ellipse(cx, cy, R, R * 0.42, 0, 0, Math.PI * 2);
        ctx.stroke();
        for (let s = 0; s < 3; s++) {
          const a = rot - s * 0.1;
          ctx.strokeStyle = rgba(c, 0.9 - s * 0.3);
          ctx.lineWidth = 3 - s;
          ctx.beginPath();
          ctx.moveTo(cx - Math.cos(a) * R, cy - Math.sin(a) * R * 0.42);
          ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R * 0.42);
          ctx.stroke();
        }
        ctx.lineWidth = 1;
        ctx.fillStyle = rgba(c, 1);
        ctx.beginPath();
        ctx.ellipse(cx, cy, 6, 3, 0, 0, Math.PI * 2);
        ctx.fill();
      },
    };
  });
  return (
    <div ref={wrapRef} className={`pointer-events-none ${className}`} aria-hidden="true">
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}

/** A response surface built from past runs: dithered heights + wireframe + data points. */
export function ResponseSurface({ className = "" }: { className?: string }) {
  const { wrapRef, canvasRef } = useCanvasSim((env) => {
    const { ctx } = env;
    const G = 22;
    const runs = Array.from({ length: 16 }, () => [Math.random(), Math.random()] as [number, number]);
    const height = (u: number, v: number, t: number) =>
      0.55 * fbm(u * 2.2 + 3, v * 2.2 + t * 0.00003, 7, 3) + 0.25 * Math.exp(-((u - 0.6) ** 2 + (v - 0.4) ** 2) / 0.05);
    return {
      frame(t) {
        const { w: W, h: H } = env;
        ctx.clearRect(0, 0, W, H);
        const yaw = 0.7 + Math.sin(t / 5000) * 0.25;
        const cy = Math.cos(yaw);
        const sy = Math.sin(yaw);
        const S = Math.min(W, H) * 0.62;
        const P = (u: number, v: number, z: number) => {
          const x = (u - 0.5) * cy - (v - 0.5) * sy;
          const y = (u - 0.5) * sy + (v - 0.5) * cy;
          return [W / 2 + x * S, H * 0.6 - y * S * 0.5 - z * S * 0.55] as const;
        };
        // dithered fill, back to front
        const cell = 3;
        for (let j = G - 1; j >= 0; j--)
          for (let i = 0; i < G; i++) {
            const u = i / (G - 1);
            const v = j / (G - 1);
            const z = height(u, v, t);
            const [x, y] = P(u, v, z);
            const c = terrainMap(z * 1.25);
            for (let d = 0; d < 9; d++) {
              const ox = (d % 3) * cell;
              const oy = Math.floor(d / 3) * cell;
              if (0.55 > BAYER8[((oy + i) & 7) * 8 + ((ox + j) & 7)]) {
                ctx.fillStyle = rgba(c, 0.95);
                ctx.fillRect(Math.round(x + ox - 4), Math.round(y + oy - 4), cell - 1, cell - 1);
              }
            }
          }
        // wire
        ctx.strokeStyle = "rgba(46,46,56,0.28)";
        for (let j = 0; j < G; j += 3) {
          ctx.beginPath();
          for (let i = 0; i < G; i++) {
            const [x, y] = P(i / (G - 1), j / (G - 1), height(i / (G - 1), j / (G - 1), t));
            if (i) ctx.lineTo(x, y);
            else ctx.moveTo(x, y);
          }
          ctx.stroke();
        }
        // past runs: stems + dots
        for (const [u, v] of runs) {
          const z = height(u, v, t);
          const [x0, y0] = P(u, v, 0);
          const [x1, y1] = P(u, v, z);
          ctx.strokeStyle = "rgba(46,46,56,0.35)";
          ctx.beginPath();
          ctx.moveTo(x0, y0);
          ctx.lineTo(x1, y1);
          ctx.stroke();
          ctx.fillStyle = "#2e2e38";
          ctx.fillRect(Math.round(x1) - 2, Math.round(y1) - 2, 4, 4);
        }
      },
    };
  });
  return (
    <div ref={wrapRef} className={`pointer-events-none ${className}`} aria-hidden="true">
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}

/**
 * Tissue engineering: a porous lattice scaffold, slowly turning, with cells
 * seeding onto the struts and proliferating (dithered clusters) until confluent.
 */
export function Tissue({ className = "", color = "#7cc0a0" }: { className?: string; color?: string }) {
  const { wrapRef, canvasRef } = useCanvasSim((env) => {
    const { ctx } = env;
    const c = hex(color);
    const pale = hex("#d6efe2");
    const N = 4;
    const nodes: [number, number, number][] = [];
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) for (let k = 0; k < 3; k++) nodes.push([i / (N - 1) - 0.5, j / (N - 1) - 0.5, k / 2 - 0.5]);
    const idx = (i: number, j: number, k: number) => (i * N + j) * 3 + k;
    const struts: [number, number][] = [];
    for (let i = 0; i < N; i++)
      for (let j = 0; j < N; j++)
        for (let k = 0; k < 3; k++) {
          if (i < N - 1) struts.push([idx(i, j, k), idx(i + 1, j, k)]);
          if (j < N - 1) struts.push([idx(i, j, k), idx(i, j + 1, k)]);
          if (k < 2) struts.push([idx(i, j, k), idx(i, j, k + 1)]);
        }
    type Colony = { s: number; f: number; born: number };
    let colonies: Colony[] = [];
    let clock = 0;
    let nextSeed = 0;
    const seed = () => {
      // prefer struts touching existing colonies (proliferation)
      let pick = Math.floor(Math.random() * struts.length);
      if (colonies.length && Math.random() < 0.75) {
        const host = struts[colonies[Math.floor(Math.random() * colonies.length)].s];
        const near = struts.map((t, i) => [t, i] as const).filter(([t]) => t[0] === host[0] || t[0] === host[1] || t[1] === host[0] || t[1] === host[1]);
        pick = near[Math.floor(Math.random() * near.length)][1];
      }
      colonies.push({ s: pick, f: Math.random(), born: clock });
    };
    for (let n = 0; n < 4; n++) seed();
    const cell = 3;
    return {
      frame(t, dt) {
        const { w: W, h: H } = env;
        clock += env.reduced ? 9000 : dt;
        if (!env.reduced && clock > nextSeed) {
          nextSeed = clock + 260;
          seed();
          if (colonies.length > 70) {
            colonies = [];
            for (let n = 0; n < 4; n++) seed();
          }
        }
        ctx.clearRect(0, 0, W, H);
        const yaw = 0.6 + t * 0.00008;
        const cy = Math.cos(yaw);
        const sy = Math.sin(yaw);
        const S = Math.min(W, H) * 0.62;
        const P = (x: number, y: number, z: number) => {
          const xr = x * cy - y * sy;
          const yr = x * sy + y * cy;
          return [W / 2 + xr * S, H * 0.48 - yr * S * 0.45 - z * S * 0.62, yr] as const;
        };
        const proj = nodes.map((n) => P(n[0], n[1], n[2]));
        // struts, far to near
        const order = struts.map((st, i) => [i, (proj[st[0]][2] + proj[st[1]][2]) / 2] as const).sort((a, b) => b[1] - a[1]);
        ctx.lineWidth = 2;
        for (const [i, d] of order) {
          const [a, b] = struts[i];
          ctx.strokeStyle = rgba(c, 0.25 + 0.35 * (0.5 - d));
          ctx.beginPath();
          ctx.moveTo(proj[a][0], proj[a][1]);
          ctx.lineTo(proj[b][0], proj[b][1]);
          ctx.stroke();
        }
        ctx.lineWidth = 1;
        // colonies: dithered blobs that grow along their strut
        for (const col of colonies) {
          const [a, b] = struts[col.s];
          const x = proj[a][0] + (proj[b][0] - proj[a][0]) * col.f;
          const y = proj[a][1] + (proj[b][1] - proj[a][1]) * col.f;
          const age = (clock - col.born) / 1000;
          const R = Math.min(1, age / 2.5) * S * 0.07 + 2;
          for (let yy = -R; yy < R; yy += cell)
            for (let xx = -R; xx < R; xx += cell) {
              const d = Math.hypot(xx, yy) / R;
              if (d > 1) continue;
              const gx = Math.floor((x + xx) / cell) & 7;
              const gy = Math.floor((y + yy) / cell) & 7;
              if (1 - d * 0.8 > BAYER8[gy * 8 + gx]) {
                ctx.fillStyle = rgba(d < 0.35 ? c : pale, 0.95);
                ctx.fillRect(Math.round(x + xx), Math.round(y + yy), cell - 1, cell - 1);
              }
            }
        }
        const cov = Math.min(100, Math.round((colonies.length / 70) * 100));
        ctx.fillStyle = rgba(pale, 0.8);
        ctx.font = `10px ${env.mono}`;
        ctx.fillText(`SCAFFOLD · COVERAGE ${cov}%`, 14, H - 12);
      },
    };
  });
  return (
    <div ref={wrapRef} className={`pointer-events-none ${className}`} aria-hidden="true">
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}

/** Bioprocess: a stirred bioreactor — dithered culture density, rising sparge bubbles, turning impeller. */
export function Bioreactor({ className = "" }: { className?: string }) {
  const { wrapRef, canvasRef } = useCanvasSim((env) => {
    const { ctx } = env;
    const N = 90;
    const bx = new Float32Array(N).map(() => Math.random());
    const by = new Float32Array(N).map(() => Math.random());
    const bs = new Float32Array(N).map(() => 0.4 + Math.random() * 0.6);
    const ink = hex("#1f3d2b");
    const liquid = hex("#9bc77d");
    const dense = hex("#4f8a4a");
    return {
      frame(t, dt) {
        const { w: W, h: H } = env;
        ctx.clearRect(0, 0, W, H);
        const vw = Math.min(W * 0.46, H * 0.62);
        const vh = H * 0.74;
        const x0 = (W - vw) / 2;
        const y0 = H * 0.1;
        const level = y0 + vh * 0.2;
        const cell = 3;
        // culture: denser towards the bottom, slowly swirling
        for (let y = level; y < y0 + vh - 6; y += cell)
          for (let x = x0 + 4; x < x0 + vw - 4; x += cell) {
            const d = (y - level) / (vh * 0.8);
            const n = fbm(x * 0.03 + Math.sin(t / 3000) * 0.6, y * 0.03 - t * 0.0002, 2, 2);
            const v = 0.25 + d * 0.45 + (n - 0.5) * 0.5;
            const th = BAYER8[((y / cell) & 7) * 8 + ((x / cell) & 7)];
            if (v > th) {
              ctx.fillStyle = rgba(v > 0.75 && th < 0.4 ? dense : liquid, 0.95);
              ctx.fillRect(Math.round(x), Math.round(y), cell - 1, cell - 1);
            }
          }
        // bubbles from the sparger ring
        for (let i = 0; i < N; i++) {
          if (!env.reduced) {
            by[i] -= (dt / 1000) * 0.22 * bs[i];
            bx[i] += Math.sin(t / 300 + i) * 0.0008;
          }
          if (by[i] < 0) {
            by[i] = 1;
            bx[i] = 0.3 + Math.random() * 0.4;
          }
          const px = x0 + 6 + bx[i] * (vw - 12);
          const py = level + by[i] * (y0 + vh - level - 10);
          ctx.strokeStyle = rgba(ink, 0.6);
          ctx.strokeRect(Math.round(px), Math.round(py), 2 + bs[i] * 2, 2 + bs[i] * 2);
        }
        // impeller shaft + blades
        const cx = W / 2;
        ctx.strokeStyle = rgba(ink, 0.9);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx, y0 - 8);
        ctx.lineTo(cx, y0 + vh * 0.72);
        ctx.stroke();
        const a = t * 0.004;
        for (const yy of [0.5, 0.72]) {
          const w = Math.cos(a) * vw * 0.22;
          ctx.beginPath();
          ctx.moveTo(cx - w, y0 + vh * yy);
          ctx.lineTo(cx + w, y0 + vh * yy);
          ctx.stroke();
        }
        ctx.lineWidth = 1;
        // vessel
        ctx.strokeStyle = rgba(ink, 0.85);
        ctx.beginPath();
        ctx.roundRect(x0, y0, vw, vh, [6, 6, vw * 0.25, vw * 0.25]);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x0 + 4, level);
        ctx.lineTo(x0 + vw - 4, level);
        ctx.stroke();
        ctx.fillStyle = rgba(ink, 0.75);
        ctx.font = `10px ${env.mono}`;
        const od = (1.2 + 0.8 * (0.5 + 0.5 * Math.sin(t / 4000))).toFixed(2);
        ctx.fillText(`OD600 ${od}`, 14, H - 14);
        ctx.textAlign = "right";
        ctx.fillText("PH 6.9 · 37 °C", W - 14, H - 14);
        ctx.textAlign = "left";
      },
    };
  });
  return (
    <div ref={wrapRef} className={`pointer-events-none ${className}`} aria-hidden="true">
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}

/** Protein design: a folded chain, coloured by predicted per-residue confidence. */
export function ProteinFold({ className = "" }: { className?: string }) {
  const { wrapRef, canvasRef } = useCanvasSim((env) => {
    const { ctx } = env;
    const sure = hex("#7fb8e6");
    const mid = hex("#e9d79a");
    const unsure = hex("#e39a5a");
    const R = 46;
    // a helix–loop–strand path, deterministic
    const pts: [number, number, number, number][] = [];
    for (let i = 0; i < R; i++) {
      const s = i / R;
      let x: number, y: number, z: number;
      if (s < 0.45) {
        const a = s * 26;
        x = Math.cos(a) * 0.32 - 0.5;
        y = (s / 0.45) * 1.6 - 0.8;
        z = Math.sin(a) * 0.32;
      } else if (s < 0.62) {
        const u = (s - 0.45) / 0.17;
        x = -0.5 + u * 1.1;
        y = 0.8 + Math.sin(u * Math.PI) * 0.45;
        z = Math.cos(u * 4) * 0.35;
      } else {
        const u = (s - 0.62) / 0.38;
        x = 0.6 + Math.sin(u * 9) * 0.18;
        y = 0.8 - u * 1.7;
        z = -0.2 + u * 0.4;
      }
      // the loop is the least certain region
      const conf = s > 0.43 && s < 0.66 ? 0.35 + 0.15 * Math.sin(i) : 0.85 + 0.1 * Math.cos(i);
      pts.push([x, y, z, conf]);
    }
    return {
      frame(t) {
        const { w: W, h: H } = env;
        ctx.clearRect(0, 0, W, H);
        const yaw = t * 0.0004;
        const c = Math.cos(yaw);
        const s = Math.sin(yaw);
        const S = Math.min(W * 0.5, H * 0.36);
        const P = pts.map(([x, y, z, k]) => {
          const xr = x * c - z * s;
          const zr = x * s + z * c;
          return { x: W / 2 + xr * S, y: H * 0.5 - y * S * 0.92, z: zr, k };
        });
        ctx.strokeStyle = "rgba(255,255,255,0.35)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        P.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
        ctx.stroke();
        ctx.lineWidth = 1;
        const order = P.map((p, i) => [i, p.z] as const).sort((a, b) => a[1] - b[1]);
        const cell = 3;
        for (const [i] of order) {
          const p = P[i];
          const r = 8 + p.z * 3;
          const col = p.k > 0.75 ? sure : p.k > 0.5 ? mid : unsure;
          for (let y = -r; y < r; y += cell)
            for (let x = -r; x < r; x += cell) {
              const d = Math.hypot(x, y) / r;
              if (d > 1) continue;
              const th = BAYER8[((Math.floor((p.y + y) / cell) & 7) << 3) + (Math.floor((p.x + x) / cell) & 7)];
              if (1 - d * 0.7 + p.z * 0.2 > th) {
                ctx.fillStyle = rgba(col, 0.95);
                ctx.fillRect(Math.round(p.x + x), Math.round(p.y + y), cell - 1, cell - 1);
              }
            }
        }
        ctx.font = `10px ${env.mono}`;
        ctx.fillStyle = rgba(sure, 1);
        ctx.fillText("■ CONFIDENT", 14, H - 14);
        ctx.fillStyle = rgba(unsure, 1);
        ctx.fillText("■ VERIFY", 104, H - 14);
      },
    };
  });
  return (
    <div ref={wrapRef} className={`pointer-events-none ${className}`} aria-hidden="true">
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}

/** Lab assays: a 96-well plate — predicted wells stay hollow, only uncertain wells get run. */
export function WellPlate({ className = "" }: { className?: string }) {
  const { wrapRef, canvasRef } = useCanvasSim((env) => {
    const { ctx } = env;
    const COLS = 12;
    const ROWS = 8;
    const ink = hex("#2e2e38");
    const conf = Array.from({ length: COLS * ROWS }, (_, i) => fbm((i % COLS) * 0.35, Math.floor(i / COLS) * 0.35, 4, 2));
    const order = conf.map((c, i) => [i, c] as const).sort((a, b) => a[1] - b[1]);
    const toRun = new Set(order.slice(0, 18).map(([i]) => i)); // least confident wells
    const runOrder = [...toRun];
    return {
      frame(t) {
        const { w: W, h: H } = env;
        ctx.clearRect(0, 0, W, H);
        const pw = Math.min(W * 0.84, H * 1.25);
        const ph = pw * 0.68;
        const x0 = (W - pw) / 2;
        const y0 = (H - ph) / 2 - 10;
        ctx.strokeStyle = rgba(ink, 0.7);
        ctx.beginPath();
        ctx.roundRect(x0, y0, pw, ph, 10);
        ctx.stroke();
        const gx = pw / (COLS + 1);
        const gy = ph / (ROWS + 1);
        const r = Math.min(gx, gy) * 0.36;
        const cycle = env.reduced ? 1 : (t % 9000) / 7000;
        const ran = Math.floor(Math.min(1, cycle) * runOrder.length);
        const cell = 2;
        for (let i = 0; i < COLS * ROWS; i++) {
          const cx = x0 + gx * ((i % COLS) + 1);
          const cy = y0 + gy * (Math.floor(i / COLS) + 1);
          const tested = toRun.has(i) && runOrder.indexOf(i) < ran;
          if (tested) {
            const v = terrainMap(0.15 + conf[i] * 1.2);
            for (let y = -r; y < r; y += cell)
              for (let x = -r; x < r; x += cell) {
                const d = Math.hypot(x, y) / r;
                if (d > 1) continue;
                if (1 - d * 0.5 > BAYER8[((Math.floor((cy + y) / cell) & 7) << 3) + (Math.floor((cx + x) / cell) & 7)]) {
                  ctx.fillStyle = rgba(v, 1);
                  ctx.fillRect(Math.round(cx + x), Math.round(cy + y), cell, cell);
                }
              }
          } else {
            ctx.strokeStyle = toRun.has(i) ? "rgba(46,91,255,0.8)" : rgba(ink, 0.35);
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
        ctx.font = `10px ${env.mono}`;
        ctx.fillStyle = rgba(ink, 0.8);
        ctx.fillText(`RUN ${ran} / 96 WELLS · REST PREDICTED`, x0, y0 + ph + 22);
      },
    };
  });
  return (
    <div ref={wrapRef} className={`pointer-events-none ${className}`} aria-hidden="true">
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}

/** Structures: a cantilevered truss under a tip load; members dither by stress, the whole thing flexes. */
export function Truss({ className = "" }: { className?: string }) {
  const { wrapRef, canvasRef } = useCanvasSim((env) => {
    const { ctx } = env;
    const B = 7; // bays
    return {
      frame(t) {
        const { w: W, h: H } = env;
        ctx.clearRect(0, 0, W, H);
        const L = W * 0.78;
        const h = Math.min(H * 0.22, L / B);
        const x0 = W * 0.1;
        const yMid = H * 0.44;
        const load = 0.6 + 0.4 * Math.sin(t / 900);
        const sag = (x: number) => -(((x / L) ** 2) * (3 - x / L)) * H * 0.07 * load;
        const node = (i: number, top: boolean): [number, number] => {
          const x = (i / B) * L;
          return [x0 + x, yMid + (top ? -h / 2 : h / 2) - sag(x)];
        };
        const members: [[number, number], [number, number], number][] = [];
        for (let i = 0; i < B; i++) {
          const s = 1 - i / B; // bending stress highest at the wall
          members.push([node(i, true), node(i + 1, true), s]);
          members.push([node(i, false), node(i + 1, false), s * 0.9]);
          members.push([node(i, i % 2 === 0), node(i + 1, i % 2 !== 0), 0.35 + 0.2 * s]);
          members.push([node(i + 1, true), node(i + 1, false), 0.2]);
        }
        const cell = 3;
        for (const [a, b, s] of members) {
          const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
          const c = thermalMapLocal(s * load);
          for (let d = 0; d < len; d += 1.5) {
            const x = a[0] + ((b[0] - a[0]) * d) / len;
            const y = a[1] + ((b[1] - a[1]) * d) / len;
            for (let o = -1; o <= 1; o++) {
              const px = Math.round(x + o * ((a[1] - b[1]) / len) * 1.5);
              const py = Math.round(y + o * ((b[0] - a[0]) / len) * 1.5);
              if (0.35 + s * 0.65 > BAYER8[((py / cell) & 7) * 8 + ((px / cell) & 7)]) {
                ctx.fillStyle = rgba(c, 1);
                ctx.fillRect(px, py, 2, 2);
              }
            }
          }
        }
        // wall + hatching
        ctx.strokeStyle = "rgba(46,46,56,0.8)";
        ctx.beginPath();
        ctx.moveTo(x0, yMid - h);
        ctx.lineTo(x0, yMid + h);
        for (let y = yMid - h; y < yMid + h; y += 6) {
          ctx.moveTo(x0, y);
          ctx.lineTo(x0 - 6, y + 6);
        }
        ctx.stroke();
        // tip load
        const tip = node(B, false);
        ctx.strokeStyle = "#2e2e38";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(tip[0], tip[1] + 6);
        ctx.lineTo(tip[0], tip[1] + 6 + 26 * load);
        ctx.stroke();
        ctx.lineWidth = 1;
        ctx.font = `10px ${env.mono}`;
        ctx.fillStyle = "rgba(46,46,56,0.8)";
        ctx.fillText(`δ TIP ${(1.8 * load).toFixed(2)} MM`, 14, H - 14);
      },
    };
  });
  return (
    <div ref={wrapRef} className={`pointer-events-none ${className}`} aria-hidden="true">
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
const thermalMapLocal = (t: number) => terrainMap(0.95 - Math.min(1, Math.max(0, t)) * 0.9);
