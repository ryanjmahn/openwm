"use client";

import { useRef, useState } from "react";
import { BAYER8, thermalMap, rgba } from "./color";
import { useCanvasSim } from "./useCanvasSim";

/*
 * Heat-sink cross-section: explicit finite-difference conduction in the metal,
 * buoyant upward advection in the air. The live field is the "real solver";
 * the model predicts peak temperature instantly from runs it has already seen
 * and learns each converged result.
 */

const NX = 120;
const NY = 78;
const BASE0 = 8;
const BASE1 = 13;
const FIN_H = 42;
const K_SOLID = 0.24;
const K_AIR = 0.028;
const SOURCE = 0.0105;
const ITERS = 36;
const toC = (t: number) => 25 + t * 32;

type Readout = { fins: number; pred: string; conf: number; solver: string; converged: boolean; learned: number };

function buildMask(fins: number) {
  const solid = new Uint8Array(NX * NY); // 1 metal, 2 chip
  for (let j = BASE0; j < BASE1; j++) for (let i = 8; i < NX - 8; i++) solid[j * NX + i] = 1;
  for (let j = 3; j < BASE0; j++) for (let i = NX / 2 - 12; i < NX / 2 + 12; i++) solid[j * NX + i] = 2;
  const span = NX - 24;
  for (let f = 0; f < fins; f++) {
    const c = Math.round(12 + (f * span) / (fins - 1));
    for (let j = BASE1; j < BASE1 + FIN_H; j++) for (let i = c - 1; i <= c + 1; i++) solid[j * NX + i] = 1;
  }
  return solid;
}

export function ThermalSim({ compact = false, className = "" }: { compact?: boolean; className?: string }) {
  const [fins, setFins] = useState(6);
  const finsRef = useRef(6);
  const [read, setRead] = useState<Readout | null>(null);

  const { wrapRef, canvasRef } = useCanvasSim(
    (env) => {
      const { ctx } = env;
      let T = new Float32Array(NX * NY);
      let T2 = new Float32Array(NX * NY);
      let solid = buildMask(finsRef.current);
      let current = finsRef.current;
      const known = new Map<number, number>();
      let stable = 0;
      let lastMax = 0;
      let reported = "";
      let autoTimer = 0;

      const off = document.createElement("canvas");
      off.width = NX;
      off.height = NY;
      const octx = off.getContext("2d")!;
      const img = octx.createImageData(NX, NY);

      const parts = Array.from({ length: compact ? 70 : 140 }, () => ({ x: Math.random() * NX, y: Math.random() * NY }));

      const predict = (f: number) => {
        if (known.has(f)) return { v: known.get(f)!, conf: 0.99 };
        const lo = known.get(f - 1);
        const hi = known.get(f + 1);
        if (lo !== undefined && hi !== undefined) return { v: (lo + hi) / 2, conf: 0.93 };
        const near = lo ?? hi;
        if (near !== undefined) return { v: near + (lo !== undefined ? -0.06 : 0.06), conf: 0.78 };
        return { v: 1.6 - f * 0.08, conf: 0.56 }; // prior guess
      };

      const step = () => {
        let mx = 0;
        for (let j = 0; j < NY; j++) {
          for (let i = 0; i < NX; i++) {
            const id = j * NX + i;
            const s = solid[id];
            const t = T[id];
            if (j === 0) {
              T2[id] = 0;
              continue;
            }
            if (j === NY - 1) {
              T2[id] = T[id - NX];
              continue;
            }
            const k = s ? K_SOLID : K_AIR;
            const nb = (n: number) => {
              const kn = solid[n] ? K_SOLID : K_AIR;
              return ((2 * k * kn) / (k + kn)) * (T[n] - t);
            };
            let d = nb(id - NX) + nb(id + NX) + (i > 0 ? nb(id - 1) : 0) + (i < NX - 1 ? nb(id + 1) : 0);
            if (!s) {
              const v = Math.min(0.9, 0.22 + 0.5 * t);
              d -= v * (t - T[id - NX]);
            } else if (s === 2) d += SOURCE;
            const nt = t + d;
            T2[id] = nt;
            if (s && nt > mx) mx = nt;
          }
        }
        const tmp = T;
        T = T2;
        T2 = tmp;
        return mx;
      };

      const emit = (mx: number) => {
        const p = predict(current);
        const converged = stable > 50;
        const r: Readout = {
          fins: current,
          pred: toC(p.v).toFixed(1),
          conf: p.conf,
          solver: toC(mx).toFixed(1),
          converged,
          learned: known.size,
        };
        const key = `${r.fins}|${r.pred}|${r.solver}|${r.converged}|${r.learned}`;
        if (key !== reported) {
          reported = key;
          setRead(r);
        }
      };

      // warm start so the first paint already looks like heat
      for (let n = 0; n < 900; n++) step();

      return {
        frame(t, dt) {
          const { w: W, h: H } = env;
          // compact mode cycles through designs on its own
          if (compact) {
            autoTimer += dt;
            if (autoTimer > 5200) {
              autoTimer = 0;
              finsRef.current = 4 + ((finsRef.current - 3) % 6);
            }
          }
          if (finsRef.current !== current) {
            current = finsRef.current;
            solid = buildMask(current);
            stable = 0;
          }
          let mx = 0;
          const iters = env.reduced ? 1 : ITERS;
          for (let n = 0; n < iters; n++) mx = step();
          if (Math.abs(mx - lastMax) < 2e-5) stable++;
          else stable = Math.max(0, stable - 2);
          lastMax = mx;
          if (stable === 51 && !known.has(current)) known.set(current, mx);
          if (!compact && Math.round(t / 120) !== Math.round((t - dt) / 120)) emit(mx);
          if (!compact && dt === 0) emit(mx);

          // dithered field: 7 levels
          const L = 7;
          const d = img.data;
          for (let j = 0; j < NY; j++) {
            for (let i = 0; i < NX; i++) {
              const id = j * NX + i;
              const tt = Math.min(1, T[id] / 1.25);
              const q = Math.min(L, Math.floor(tt * L + BAYER8[((NY - 1 - j) & 7) * 8 + (i & 7)])) / L;
              const c = thermalMap(q);
              const o = ((NY - 1 - j) * NX + i) * 4;
              d[o] = c[0];
              d[o + 1] = c[1];
              d[o + 2] = c[2];
              d[o + 3] = 255;
            }
          }
          octx.putImageData(img, 0, 0);
          ctx.clearRect(0, 0, W, H);
          ctx.imageSmoothingEnabled = false;
          const cw = W / NX;
          const ch = H / NY;
          ctx.drawImage(off, 0, 0, W, H);

          // metal outlines
          ctx.strokeStyle = "rgba(46,46,56,0.75)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          const X = (i: number) => i * cw;
          const Y = (j: number) => H - j * ch;
          ctx.rect(X(8), Y(BASE1), X(NX - 8) - X(8), Y(BASE0) - Y(BASE1));
          ctx.rect(X(NX / 2 - 12), Y(BASE0), 24 * cw, Y(3) - Y(BASE0));
          const span = NX - 24;
          for (let f = 0; f < current; f++) {
            const c = Math.round(12 + (f * span) / (current - 1));
            ctx.rect(X(c - 1), Y(BASE1 + FIN_H), 3 * cw, Y(BASE1) - Y(BASE1 + FIN_H));
          }
          ctx.stroke();

          // air parcels
          if (!env.reduced) {
            for (const p of parts) {
              const i = Math.floor(p.x);
              const j = Math.floor(p.y);
              const id = j * NX + i;
              const tt = T[id] ?? 0;
              p.y += (0.12 + 0.45 * tt) * (dt / 16);
              p.x += Math.sin(t / 400 + p.y * 0.3) * 0.05;
              if (solid[Math.floor(p.y) * NX + i]) p.x += i % 2 ? 1.2 : -1.2;
              if (p.y >= NY - 1 || p.y < 0 || p.x < 0 || p.x >= NX) {
                p.y = Math.random() * 3;
                p.x = Math.random() * NX;
              }
              ctx.fillStyle = rgba(thermalMap(Math.min(1, tt * 0.9 + 0.35)), 0.95);
              ctx.fillRect(Math.round(p.x * cw), Math.round(H - p.y * ch), 2, 2);
            }
          }
        },
      };
    },
    [compact],
  );

  return (
    <div className={className}>
      <div ref={wrapRef} className="relative h-full w-full">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full [image-rendering:pixelated]"
          role="img"
          aria-label="Live thermal simulation of a heat sink cross-section: a chip heats a metal base with vertical fins, and warm air rises between the fins. Colours run from cool cream to hot plum."
        />
      </div>
      {!compact && (
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
          <label className="flex items-center gap-3">
            <span className="t-mono shrink-0 text-muted">
              Fins <span className="tabular-nums text-fg">{fins}</span>
            </span>
            <input
              type="range"
              className="range min-w-0 flex-1"
              min={3}
              max={10}
              step={1}
              value={fins}
              onChange={(e) => {
                const v = Number(e.target.value);
                finsRef.current = v;
                setFins(v);
              }}
              aria-valuetext={`${fins} fins`}
            />
          </label>
          <p className="t-mono text-muted">Runs learned: <span className="text-fg">{read?.learned ?? 0}</span></p>
          {read && (
            <dl className="t-mono grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line sm:col-span-2 sm:grid-cols-3">
              <div className="bg-surface p-3">
                <dt className="text-muted">Predicted peak</dt>
                <dd className="mt-1 text-[15px] tabular-nums text-fg">{read.pred} °C</dd>
              </div>
              <div className="bg-surface p-3">
                <dt className="text-muted">Confidence</dt>
                <dd className={`mt-1 text-[15px] tabular-nums ${read.conf < 0.85 ? "text-blue" : "text-fg"}`}>
                  {read.conf.toFixed(2)} {read.conf < 0.85 ? "· verify" : "· trust"}
                </dd>
              </div>
              <div className="col-span-2 bg-surface p-3 sm:col-span-1">
                <dt className="text-muted">Solver {read.converged ? "· converged" : "· running"}</dt>
                <dd className="mt-1 text-[15px] tabular-nums text-fg">{read.solver} °C</dd>
              </div>
            </dl>
          )}
        </div>
      )}
    </div>
  );
}
