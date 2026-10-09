"use client";

import { useState } from "react";
import { BAYER8 } from "@/components/sims/color";
import { useCanvasSim } from "@/components/sims/useCanvasSim";
import { camera, drawObjs, makeDitherer, ringPath } from "@/components/sims/iso3d";
import { propeller, thrustStand } from "./parts";
import { SceneHud } from "./SceneHud";

/*
 * 03 Verify — the uncertain design becomes hardware. A printed prop is mounted
 * on a thrust stand, swept through RPM, and the measured thrust is plotted
 * against the prediction (with its uncertainty band). The result is learned:
 * the band tightens.
 */
const LOOP = 10500;
const T_MOUNT = 1300;
const T_SWEEP0 = 2300;
const T_SWEEP1 = 7600;
const RPM_MAX = 9000;
const pred = (r: number) => 0.0000000495 * r * r; // N, illustrative
const meas = (r: number, i: number) => pred(r) * (0.972 + 0.012 * Math.sin(i * 2.7));

type Phase = "mount" | "spin" | "measure" | "verified";

export function PropVerify() {
  const [phase, setPhase] = useState<Phase>("mount");
  const [rpm, setRpm] = useState(0);

  const { wrapRef, canvasRef } = useCanvasSim((env) => {
    const { ctx } = env;
    const stand = thrustStand();
    const dith = makeDitherer();
    let angle = 0;
    let last = "";
    let lastRpm = -1;
    const N = 200;
    const px = new Float32Array(N);
    const py = new Float32Array(N);
    const pz = new Float32Array(N);
    const pa = new Float32Array(N).fill(9);
    let k = 0;
    return {
      frame(t, dt) {
        const { w: W, h: H } = env;
        const lt = env.reduced ? 9000 : t % LOOP;
        const sweep = Math.min(1, Math.max(0, (lt - T_SWEEP0) / (T_SWEEP1 - T_SWEEP0)));
        const r =
          lt < T_MOUNT
            ? 0
            : lt < T_SWEEP0
              ? ((lt - T_MOUNT) / (T_SWEEP0 - T_MOUNT)) * 1500
              : 1500 + sweep * (RPM_MAX - 1500);
        const rpmNow = lt > T_SWEEP1 + 600 ? Math.max(0, RPM_MAX * (1 - (lt - T_SWEEP1 - 600) / 1200)) : r;
        const p: Phase = lt < T_MOUNT ? "mount" : lt < T_SWEEP0 ? "spin" : lt < T_SWEEP1 ? "measure" : "verified";
        if (p !== last) {
          last = p;
          setPhase(p);
        }
        const rr = Math.round(rpmNow / 100) * 100;
        if (rr !== lastRpm) {
          lastRpm = rr;
          setRpm(rr);
        }

        const narrow = W < 560;
        const sceneW = narrow ? W : W * 0.56;
        const sceneH = narrow ? H * 0.6 : H;
        // keep the stand clear of the readout card (top-left)
        const S = Math.min(sceneW / 4.8, narrow ? sceneH * 0.17 : H * 0.165);
        const cam = camera(S, 0.7, 0.42, sceneW * (narrow ? 0.66 : 0.64), sceneH * 0.94);
        ctx.clearRect(0, 0, W, H);
        const dc = W > 640 ? 3 : 2;
        const g = dith.begin(W, H, dc);

        // ground
        g.fillStyle = "rgba(46,46,56,0.2)";
        ringPath(g, cam, 0, 0, 0, 2.1);
        g.fill();

        angle += (rpmNow / 60) * 2 * Math.PI * (dt / 1000) * 0.05;
        const drop = lt < T_MOUNT ? (1 - lt / T_MOUNT) ** 2 * 1.4 : 0;
        // cable stand → DAQ
        const c0 = cam.proj(0.42, 0.2, 2.3);
        const c1 = cam.proj(1.05, 0.65, 0.75);
        g.strokeStyle = "#2e2e38";
        g.lineWidth = dc;
        g.beginPath();
        g.moveTo(c0[0], c0[1]);
        g.bezierCurveTo(c0[0] + 40, c0[1] + 10, c1[0] + 10, c1[1] - 60, c1[0], c1[1]);
        g.stroke();
        drawObjs(g, cam, stand, { edge: 0.85, lineWidth: dc });
        // DAQ screen
        const d0 = cam.proj(0.75, 0.6, 0.62);
        g.fillStyle = "#2e2e38";
        g.fillRect(d0[0] - 2, d0[1] - 14, 18, 9);
        g.fillStyle = "#7cc0a0";
        g.fillRect(d0[0] + 1, d0[1] - 11, 4 + 8 * (rpmNow / RPM_MAX), 3);

        // spinning disc + prop
        const blur = Math.min(1, rpmNow / 3000);
        if (blur > 0.05) {
          ringPath(g, cam, 0, 0, 3.05 + drop, 1.48);
          g.fillStyle = `rgba(46,46,56,${0.18 * blur})`;
          g.fill();
          g.strokeStyle = `rgba(46,46,56,${0.6 * blur})`;
          g.stroke();
        }
        drawObjs(g, cam, propeller(angle), { offset: [0, 0, drop], alpha: 1 - blur * 0.6, edge: 0.85, lineWidth: dc });
        dith.end(ctx);

        // downwash particles
        if (!env.reduced && rpmNow > 1500)
          for (let n = 0; n < 4; n++) {
            const a = Math.random() * Math.PI * 2;
            const rad = 0.3 + Math.random() * 1.1;
            px[k] = Math.cos(a) * rad;
            py[k] = Math.sin(a) * rad;
            pz[k] = 2.95;
            pa[k] = 0;
            k = (k + 1) % N;
          }
        for (let i = 0; i < N; i++) {
          if (pa[i] > 1.2) continue;
          pa[i] += dt / 1000;
          pz[i] -= (dt / 1000) * (1.4 + rpmNow / 3000);
          const q = cam.proj(px[i] * (1 + pa[i] * 0.3), py[i] * (1 + pa[i] * 0.3), pz[i]);
          ctx.fillStyle = `rgba(47,156,143,${0.8 * (1 - pa[i] / 1.2)})`;
          ctx.fillRect(Math.round(q[0]), Math.round(q[1]), 2, 2);
        }

        // ── thrust vs RPM plot ──
        const plot = narrow
          ? { x: 34, y: H * 0.64, w: W - 50, h: H * 0.3 }
          : { x: W * 0.6, y: H * 0.18, w: W * 0.36, h: H * 0.62 };
        ctx.strokeStyle = "#cfcfd8";
        ctx.beginPath();
        ctx.moveTo(plot.x, plot.y);
        ctx.lineTo(plot.x, plot.y + plot.h);
        ctx.lineTo(plot.x + plot.w, plot.y + plot.h);
        ctx.stroke();
        const X = (rv: number) => plot.x + (rv / RPM_MAX) * plot.w;
        const Tmax = pred(RPM_MAX) * 1.25;
        const Y = (tv: number) => plot.y + plot.h - (tv / Tmax) * plot.h;
        // uncertainty band — dithered, tightens once verified
        const learned = p === "verified" ? Math.min(1, (lt - T_SWEEP1) / 900) : 0;
        const cell = 3;
        for (let x = 0; x < plot.w; x += cell) {
          const rv = (x / plot.w) * RPM_MAX;
          const m = pred(rv);
          const band = m * (0.16 * (1 - learned) + 0.03 * learned) + 0.15;
          for (let y = Y(m + band); y < Y(Math.max(0, m - band)); y += cell) {
            if (0.45 > BAYER8[((Math.floor(y / cell) & 7) << 3) + ((x / cell) & 7)]) {
              ctx.fillStyle = "rgba(46,91,255,0.32)";
              ctx.fillRect(plot.x + x, y, cell - 1, cell - 1);
            }
          }
        }
        ctx.strokeStyle = "#c46a35";
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i <= 60; i++) {
          const rv = (i / 60) * RPM_MAX;
          if (i) ctx.lineTo(X(rv), Y(pred(rv)));
          else ctx.moveTo(X(rv), Y(pred(rv)));
        }
        ctx.stroke();
        ctx.lineWidth = 1;
        // measured points up to the current sweep
        const shown = p === "measure" ? r : p === "verified" ? RPM_MAX : 0;
        ctx.fillStyle = "#2e2e38";
        for (let i = 1; i <= 16; i++) {
          const rv = 1500 + ((i - 1) / 15) * (RPM_MAX - 1500);
          if (rv > shown) break;
          ctx.fillRect(Math.round(X(rv)) - 3, Math.round(Y(meas(rv, i))) - 3, 6, 6);
        }
        ctx.fillStyle = "#6b6b80";
        ctx.font = `9px ${env.mono}`;
        ctx.fillText("THRUST (N)", plot.x, plot.y - 8);
        ctx.textAlign = "right";
        ctx.fillText("RPM →", plot.x + plot.w, plot.y + plot.h + 16);
        ctx.textAlign = "left";
        ctx.fillStyle = "#c46a35";
        ctx.fillText("— PREDICTED", plot.x + 8, plot.y + 12);
        ctx.fillStyle = "#2e2e38";
        ctx.fillText("■ MEASURED", plot.x + 8, plot.y + 26);
      },
    };
  }, []);

  return (
    <div>
      <div ref={wrapRef} className="relative aspect-[16/10] w-full max-sm:aspect-[4/5]">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full"
          role="img"
          aria-label="A 3D-printed propeller is mounted on a thrust stand with a load cell wired to a data logger. It spins up through an RPM sweep while measured thrust points are plotted against the predicted curve and its uncertainty band. The measurements land inside the band, the result is marked verified, and the band tightens as the model learns from it."
        />
        <SceneHud
          kicker="Verify · aero hardware"
          title="Printed prop · thrust stand"
          rows={[
            ["Prototype", "PLA, printed in 2 h 10 m"],
            ["RPM", rpm.toLocaleString("en-US")],
            ["vs prediction", phase === "verified" ? "−2.4 % (inside band)" : phase === "measure" ? "measuring…" : "—"],
          ]}
          status={
            phase === "verified"
              ? { text: "Verified · added to training data", tone: "fg" }
              : { text: phase === "mount" ? "Mounting prototype" : "Running bench test", tone: "blue" }
          }
        />
      </div>
      <SceneHud
        below
        kicker="Verify · aero hardware"
        title="Printed prop · thrust stand"
        rows={[
          ["Prototype", "PLA, printed in 2 h 10 m"],
          ["RPM", rpm.toLocaleString("en-US")],
          ["vs prediction", phase === "verified" ? "−2.4 % (inside band)" : phase === "measure" ? "measuring…" : "—"],
        ]}
        status={
          phase === "verified"
            ? { text: "Verified · added to training data", tone: "fg" }
            : { text: phase === "mount" ? "Mounting prototype" : "Running bench test", tone: "blue" }
        }
      />
    </div>
  );
}
