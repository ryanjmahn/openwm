"use client";

import { useRef, useState } from "react";
import { BAYER8 } from "./color";
import { useCanvasSim } from "./useCanvasSim";

/*
 * Why the gate matters. An optimizer keeps proposing the design its surrogate
 * scores highest. The surrogate (trend + GP) extrapolates confidently; the
 * uncertainty band (GP-style, distance to data) says where it shouldn't.
 *   Gate ON  → uncertain proposals are sent to a real test and learned from.
 *   Gate OFF → the optimizer trusts the surrogate and ships a bad design.
 */

const truth = (x: number) => 0.32 + 0.42 * Math.exp(-((x - 0.68) ** 2) / 0.018) + 0.12 * Math.sin(x * 7.5) * (1 - x * 0.4);
const SEED = [0.4, 0.47, 0.54, 0.6];
const TAU = 0.11; // σ threshold
const STEP_MS = 1500;

type Log = { x: number; pred: number; actual: number; route: "VERIFY" | "TRUST" };

function solve(A: number[][], b: number[]) {
  const n = b.length;
  const M = A.map((r, i) => [...r, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const f = M[r][c] / M[c][c];
      for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k];
    }
  }
  return M.map((r, i) => r[n] / r[i]);
}

/** Surrogate: a linear trend plus GP (RBF) interpolation of the residuals. Off the data it follows the trend — confidently. */
function fitSurrogate(xs: number[], ys: number[]) {
  const n = xs.length;
  const kern = (a: number, b: number) => Math.exp(-((a - b) ** 2) / (2 * 0.07 * 0.07));
  const mx = xs.reduce((a, b) => a + b) / n;
  const my = ys.reduce((a, b) => a + b) / n;
  let sxy = 0;
  let sxx = 0;
  xs.forEach((x, i) => {
    sxy += (x - mx) * (ys[i] - my);
    sxx += (x - mx) ** 2;
  });
  const slope = sxx > 1e-9 ? sxy / sxx : 0;
  const icpt = my - slope * mx;
  const K = xs.map((xi, i) => xs.map((xj, j) => kern(xi, xj) + (i === j ? 1e-4 : 0)));
  const alpha = solve(
    K,
    ys.map((y, i) => y - (icpt + slope * xs[i])),
  );
  return (x: number) => icpt + slope * x + xs.reduce((s, xi, i) => s + alpha[i] * kern(x, xi), 0);
}

const sigmaAt = (x: number, xs: number[]) => {
  let m = 1;
  for (const d of xs) m *= 1 - Math.exp(-((x - d) ** 2) / (2 * 0.05 ** 2));
  return 0.02 + 0.3 * m;
};

export function UncertaintySim({ className = "" }: { className?: string }) {
  const [gate, setGate] = useState(true);
  const gateRef = useRef(true);
  const resetRef = useRef<() => void>(() => {});
  const [log, setLog] = useState<Log[]>([]);

  const { wrapRef, canvasRef } = useCanvasSim((env) => {
    const { ctx } = env;
    let xs = [...SEED];
    let ys = xs.map(truth);
    let model = fitSurrogate(xs, ys);
    let shipped: Log[] = [];
    let acc = 0;
    let flash = 0;
    let lastX = -1;

    const reset = () => {
      xs = [...SEED];
      ys = xs.map(truth);
      model = fitSurrogate(xs, ys);
      shipped = [];
      lastX = -1;
      acc = 0;
      steps = 0;
      setLog([]);
    };
    resetRef.current = reset;

    let steps = 0;
    const propose = () => {
      // an optimistic optimizer: predicted value plus a little exploration bonus
      let best = -Infinity;
      let bx = 0;
      for (let i = 0; i <= 200; i++) {
        const x = i / 200;
        const v = model(x) + 0.25 * sigmaAt(x, xs);
        if (v > best) {
          best = v;
          bx = x;
        }
      }
      return bx;
    };

    const tick = () => {
      const x = propose();
      const pred = model(x);
      const sig = sigmaAt(x, xs);
      const actual = truth(x);
      const route: Log["route"] = gateRef.current && sig > TAU ? "VERIFY" : "TRUST";
      if (route === "VERIFY") {
        xs = [...xs, x];
        ys = [...ys, actual];
        model = fitSurrogate(xs, ys);
      }
      lastX = x;
      flash = 1;
      shipped = [{ x, pred, actual, route }, ...shipped].slice(0, 4);
      setLog(shipped);
      if (++steps >= 7) {
        steps = 0;
        setTimeout(reset, STEP_MS * 0.9); // loop the demo
      }
    };

    return {
      frame(t, dt) {
        const { w: W, h: H } = env;
        if (!env.reduced) {
          acc += dt;
          if (acc > STEP_MS) {
            acc = 0;
            tick();
          }
        }
        flash = Math.max(0, flash - dt / 900);
        const pad = { l: 34, r: 14, t: 16, b: 30 };
        const pw = W - pad.l - pad.r;
        const ph = H - pad.t - pad.b;
        const X = (x: number) => pad.l + x * pw;
        const Y = (y: number) => pad.t + (1 - y / 1.05) * ph;
        ctx.clearRect(0, 0, W, H);

        ctx.save();
        ctx.beginPath();
        ctx.rect(pad.l, pad.t - 4, pw + 2, ph + 4);
        ctx.clip();
        // dithered uncertainty band — denser where the model knows less
        const cell = 3;
        for (let px = 0; px < pw; px += cell) {
          const x = px / pw;
          const m = model(x);
          const s = sigmaAt(x, xs) * 1.6;
          const y0 = Y(m + s);
          const y1 = Y(m - s);
          const dens = Math.min(1, (s - 0.03) / 0.35);
          const gx = (px / cell) & 7;
          for (let py = Math.max(pad.t, y0); py < Math.min(pad.t + ph, y1); py += cell) {
            const gy = (Math.floor(py / cell) & 7) * 8;
            if (dens * 0.9 + 0.1 > BAYER8[gy + gx]) {
              ctx.fillStyle = s / 1.6 > TAU ? "rgba(46,91,255,0.55)" : "rgba(46,91,255,0.22)";
              ctx.fillRect(X(x), py, cell - 1, cell - 1);
            }
          }
        }

        ctx.restore();
        // axes
        ctx.strokeStyle = "#cfcfd8";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(pad.l, pad.t);
        ctx.lineTo(pad.l, pad.t + ph);
        ctx.lineTo(pad.l + pw, pad.t + ph);
        ctx.stroke();
        ctx.fillStyle = "#6b6b80";
        ctx.font = `10px ${env.mono}`;
        ctx.fillText("DESIGN PARAMETER →", pad.l + pw - 118, H - 10);
        ctx.save();
        ctx.translate(12, pad.t + ph);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText("PERFORMANCE →", 0, 0);
        ctx.restore();

        ctx.save();
        ctx.beginPath();
        ctx.rect(pad.l, pad.t - 4, pw + 2, ph + 4);
        ctx.clip();
        // truth (dashed, what a real test would say)
        ctx.setLineDash([3, 4]);
        ctx.strokeStyle = "rgba(46,46,56,0.45)";
        ctx.beginPath();
        for (let i = 0; i <= 120; i++) {
          const x = i / 120;
          if (i) ctx.lineTo(X(x), Y(truth(x)));
          else ctx.moveTo(X(x), Y(truth(x)));
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // surrogate
        ctx.strokeStyle = "#c46a35";
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i <= 120; i++) {
          const x = i / 120;
          const y = Math.min(1.05, Math.max(-0.05, model(x)));
          if (i) ctx.lineTo(X(x), Y(y));
          else ctx.moveTo(X(x), Y(y));
        }
        ctx.stroke();
        ctx.lineWidth = 1;

        ctx.restore();
        // verified data
        xs.forEach((x, i) => {
          ctx.fillStyle = "#2e2e38";
          ctx.fillRect(X(x) - 3, Y(ys[i]) - 3, 6, 6);
        });

        // latest proposal
        if (lastX >= 0) {
          const s = shipped[0];
          ctx.strokeStyle = s.route === "VERIFY" ? "#2e5bff" : "#c46a35";
          ctx.globalAlpha = 0.4 + 0.6 * flash;
          ctx.beginPath();
          ctx.moveTo(X(lastX), pad.t);
          ctx.lineTo(X(lastX), pad.t + ph);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(X(lastX), Y(Math.min(1.05, s.pred)), 5 + flash * 6, 0, Math.PI * 2);
          ctx.stroke();
          if (s.route === "TRUST") {
            // the gap the optimizer never sees
            ctx.setLineDash([2, 3]);
            ctx.beginPath();
            ctx.moveTo(X(lastX), Y(Math.min(1.05, s.pred)));
            ctx.lineTo(X(lastX), Y(s.actual));
            ctx.stroke();
            ctx.setLineDash([]);
          }
          ctx.globalAlpha = 1;
        }
      },
    };
  }, []);

  return (
    <div className={className}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="seg" role="group" aria-label="Uncertainty gate">
          {[true, false].map((v) => (
            <button
              key={String(v)}
              type="button"
              aria-pressed={gate === v}
              onClick={() => {
                gateRef.current = v;
                setGate(v);
                resetRef.current();
              }}
            >
              Gate {v ? "on" : "off"}
            </button>
          ))}
        </div>
        <ul className="prose-reset t-mono flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-muted">
          <li>
            <span className="mr-1.5 inline-block h-[2px] w-4 bg-copper align-middle" />
            Surrogate
          </li>
          <li>
            <span className="mr-1.5 inline-block w-4 border-t border-dashed border-fg/60 align-middle" />
            Real result
          </li>
          <li>
            <span className="mr-1.5 inline-block h-2 w-3 bg-blue/50 align-middle" />
            Uncertainty
          </li>
        </ul>
      </div>
      <div ref={wrapRef} className="relative aspect-[16/10] w-full">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full"
          role="img"
          aria-label="Chart: an optimizer proposes designs where a fitted surrogate curve predicts the best performance. A dithered blue band shows uncertainty, widest away from tested data. With the gate on, uncertain proposals are tested and the curve corrects itself; with the gate off, the optimizer trusts a wrong prediction."
        />
      </div>
      <ol className="prose-reset mt-4 grid gap-px overflow-hidden rounded-lg border border-line bg-line text-[13px]" aria-live="off">
        {(log.length ? log : [null]).slice(0, 3).map((l, i) => (
          <li key={i} className="t-mono grid grid-cols-[1fr_auto_auto] gap-4 bg-surface px-3 py-2 normal-case tracking-normal">
            {l ? (
              <>
                <span className="text-muted">x = {l.x.toFixed(2)}</span>
                <span className="tabular-nums">
                  pred {l.pred.toFixed(2)}
                  {l.route === "VERIFY" ? ` → real ${l.actual.toFixed(2)}` : ` · real ${l.actual.toFixed(2)}`}
                </span>
                <span className={l.route === "VERIFY" ? "text-blue" : "text-copper"}>
                  {l.route === "VERIFY" ? "VERIFIED" : Math.abs(l.pred - l.actual) > 0.08 ? "SHIPPED WRONG" : "TRUSTED"}
                </span>
              </>
            ) : (
              <span className="text-muted">Optimizer warming up…</span>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
