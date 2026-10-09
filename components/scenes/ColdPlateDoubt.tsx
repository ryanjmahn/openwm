"use client";

import { BAYER8, fbm, hex, rgba, thermalMap, type RGB } from "@/components/sims/color";
import { useCanvasSim } from "@/components/sims/useCanvasSim";
import { camera, drawObjs, makeDitherer, ringPath } from "@/components/sims/iso3d";
import { coldPlate } from "./parts";
import { SceneHud } from "./SceneHud";

/*
 * 02 Measure doubt — a pin-fin cold plate. Coolant particles thread the pins.
 * Most of the plate looks like designs the model has seen; one corner uses a
 * new diamond-pin geometry, and that's where the uncertainty lights up.
 */
const BLUE: RGB = [46, 91, 255];
const TEAL = hex("#2f9c8f");
const WARM = hex("#c46a35");

export function ColdPlateDoubt() {
  const { wrapRef, canvasRef } = useCanvasSim((env) => {
    const { ctx } = env;
    const { objs, pins } = coldPlate();
    const dith = makeDitherer();
    const N = 260;
    const px = new Float32Array(N);
    const py = new Float32Array(N);
    const pz = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      px[i] = -2.6 + Math.random() * 5.2;
      py[i] = (Math.random() - 0.5) * 2.6;
      pz[i] = 0.4 + Math.random() * 0.45;
    }
    return {
      frame(t, dt) {
        const { w: W, h: H } = env;
        const S = Math.min(W / 8.2, H / 5.0);
        const cam = camera(S, 0.5 + Math.sin(t / 6000) * 0.15, 0.72, W * 0.56, H * 0.68);
        ctx.clearRect(0, 0, W, H);
        const pulse = 0.55 + 0.25 * Math.sin(t / 380);

        const dc = W > 640 ? 3 : 2;
        const g = dith.begin(W, H, dc);
        g.fillStyle = "rgba(46,46,56,0.2)";
        ringPath(g, cam, 0, 0, 0, 2.9);
        g.fill();
        drawObjs(g, cam, objs, {
          field: 0.35,
          cmap: thermalMap,
          edge: 0.85,
          lineWidth: dc,
          tint: (f) => (f.c[0] > 0.8 && f.c[1] > -0.65 && f.c[2] > 0.33 ? [BLUE, 0.45 * pulse] : null),
        });
        dith.end(ctx);

        // coolant particles (drawn over the open pin field)
        if (!env.reduced) {
          const s = dt / 1000;
          for (let i = 0; i < N; i++) {
            let vx = 1.1;
            let vy = 0;
            for (const p of pins) {
              const dx = px[i] - p.x;
              const dy = py[i] - p.y;
              const d2 = dx * dx + dy * dy;
              if (d2 < 0.12) {
                vy += (dy / (d2 + 0.02)) * 0.09;
                vx *= 0.8;
              }
            }
            px[i] += vx * s;
            py[i] = Math.max(-1.35, Math.min(1.35, py[i] + vy * s));
            if (px[i] > 2.6) {
              px[i] = -2.6;
              py[i] = (Math.random() - 0.5) * 0.8;
            }
          }
        }
        for (let i = 0; i < N; i++) {
          const q = cam.proj(px[i], py[i], pz[i]);
          const k = Math.min(1, Math.max(0, (px[i] + 2.6) / 5.2));
          const c: RGB = [
            TEAL[0] + (WARM[0] - TEAL[0]) * k,
            TEAL[1] + (WARM[1] - TEAL[1]) * k,
            TEAL[2] + (WARM[2] - TEAL[2]) * k,
          ];
          ctx.fillStyle = rgba(c, 0.85);
          ctx.fillRect(Math.round(q[0]), Math.round(q[1]), 2, 2);
        }

        // dithered uncertainty cloud over the novel region
        const cx = 1.55;
        const cy = 0.45;
        const cell = 3;
        const R = 1.25 * S;
        const c0 = cam.proj(cx, cy, 1.3);
        for (let y = -R * 0.7; y < R * 0.7; y += cell)
          for (let x = -R; x < R; x += cell) {
            const d = Math.hypot(x / R, y / (R * 0.7));
            if (d > 1) continue;
            const n = fbm((c0[0] + x) * 0.02 + t * 0.0003, (c0[1] + y) * 0.02, 3, 3);
            const v = (1 - d) * 1.4 * n * pulse;
            const gx = Math.floor((c0[0] + x) / cell) & 7;
            const gy = Math.floor((c0[1] + y) / cell) & 7;
            if (v > BAYER8[gy * 8 + gx] + 0.12) {
              ctx.fillStyle = "rgba(46,91,255,0.55)";
              ctx.fillRect(Math.round(c0[0] + x), Math.round(c0[1] + y), cell - 1, cell - 1);
            }
          }

        // callout
        const tip = cam.proj(1.5, 0.3, 1.1);
        ctx.font = `9.5px ${env.mono}`;
        const bw =
          Math.max(ctx.measureText("NEW PIN GEOMETRY").width, ctx.measureText("σ HIGH · NO SIMILAR RUNS").width) + 18;
        const lab = [Math.min(W - bw - 10, tip[0] + 40), Math.max(20, tip[1] - 70)];
        ctx.strokeStyle = "rgba(46,91,255,0.9)";
        ctx.beginPath();
        ctx.moveTo(tip[0], tip[1]);
        ctx.lineTo(lab[0], lab[1] + 6);
        ctx.stroke();
        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = "rgba(46,91,255,0.9)";
        ctx.beginPath();
        ctx.roundRect(lab[0], lab[1] - 10, bw, 34, 6);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#2e5bff";
        ctx.font = `9.5px ${env.mono}`;
        ctx.fillText("NEW PIN GEOMETRY", lab[0] + 9, lab[1] + 3);
        ctx.fillStyle = "#6b6b80";
        ctx.fillText("σ HIGH · NO SIMILAR RUNS", lab[0] + 9, lab[1] + 16);

        // flow labels
        ctx.fillStyle = "#6b6b80";
        const inl = cam.proj(-2.9, 0, 0.3);
        const out = cam.proj(2.9, 0, 0.3);
        ctx.fillText("INLET", inl[0] - 34, inl[1] + 4);
        ctx.fillText("OUTLET", out[0] + 6, out[1] + 4);
      },
    };
  }, []);

  return (
    <div>
      <div ref={wrapRef} className="relative aspect-[4/3] w-full sm:aspect-[16/10]">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full"
          role="img"
          aria-label="A copper pin-fin cold plate with coolant particles flowing from inlet to outlet, warming as they go. One corner uses a new diamond-shaped pin the model has not seen before; it glows with a dithered blue uncertainty cloud, labelled 'new pin geometry — high uncertainty'."
        />
        <SceneHud
          kicker="Measure doubt · thermal"
          title="Pin-fin cold plate"
          rows={[
            ["Predicted ΔT", "11.2 °C ± 3.9"],
            ["Pressure drop", "4.1 kPa ± 1.6"],
            [
              "Confidence",
              <span key="c" className="text-blue">
                0.62
              </span>,
            ],
          ]}
          status={{ text: "Below threshold → verify", tone: "blue" }}
        />
      </div>
      <SceneHud
        below
        kicker="Measure doubt · thermal"
        title="Pin-fin cold plate"
        rows={[
          ["Predicted ΔT", "11.2 °C ± 3.9"],
          ["Pressure drop", "4.1 kPa ± 1.6"],
          [
            "Confidence",
            <span key="c" className="text-blue">
              0.62
            </span>,
          ],
        ]}
        status={{ text: "Below threshold → verify", tone: "blue" }}
      />
    </div>
  );
}
