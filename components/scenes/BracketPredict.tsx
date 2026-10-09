"use client";

import { useState } from "react";
import { rgba, thermalMap } from "@/components/sims/color";
import { useCanvasSim } from "@/components/sims/useCanvasSim";
import { camera, drawObjs, line3, makeDitherer, ringPath } from "@/components/sims/iso3d";
import { bracket } from "./parts";
import { SceneHud } from "./SceneHud";

/*
 * 01 Predict — a motor-mount bracket under thrust load. The mesh appears, the
 * world model "solves" in under a second, and a stress field + exaggerated
 * deflection resolve on the CAD.
 */
const LOOP = 7000;

export function BracketPredict() {
  const [phase, setPhase] = useState<"mesh" | "solve" | "done">("mesh");

  const { wrapRef, canvasRef } = useCanvasSim((env) => {
    const { ctx } = env;
    const dith = makeDitherer();
    let last = "";
    return {
      frame(t) {
        const { w: W, h: H } = env;
        const lt = env.reduced ? 4000 : t % LOOP;
        const k = Math.min(1, Math.max(0, (lt - 1400) / 900)); // field fade-in
        const p = lt < 1400 ? "mesh" : lt < 2300 ? "solve" : "done";
        if (p !== last) {
          last = p;
          setPhase(p);
        }
        const S = Math.min(W / 7.4, H / 5.4);
        const cam = camera(S, 0.62 + Math.sin(t / 5200) * 0.2, 0.6, W * 0.6, H * 0.76);
        ctx.clearRect(0, 0, W, H);
        const cell = W > 640 ? 3 : 2;
        const g = dith.begin(W, H, cell);

        // ground shadow (dithers into a stipple)
        g.fillStyle = "rgba(46,46,56,0.22)";
        ringPath(g, cam, 0.1, 0.2, 0, 2.0);
        g.fill();

        const defl = k * (0.16 + 0.03 * Math.sin(t / 500));
        const b = bracket(defl);
        drawObjs(g, cam, b.objs, { field: k, cmap: thermalMap, edge: 0.9, lineWidth: cell });

        // FEA mesh on the wall face
        g.lineWidth = cell * 0.8;
        g.strokeStyle = `rgba(46,46,56,${0.35 + 0.25 * (1 - k)})`;
        for (let x = -1.7; x <= 1.71; x += 0.34) line3(g, cam, [x, 0.84, 0.28], [x, 0.84 - defl, 2.5]);
        for (let z = 0.28; z <= 2.5; z += 0.37) {
          const bz = -defl * ((z - 0.28) / 2.2) ** 2;
          line3(g, cam, [-1.7, 0.84 + bz, z], [1.7, 0.84 + bz, z]);
        }

        // motor bolt pattern
        for (const h of b.holes) {
          g.beginPath();
          for (let i = 0; i <= 24; i++) {
            const a = (i / 24) * Math.PI * 2;
            const q = cam.proj(h.c[0] + Math.cos(a) * h.r, h.c[1] - 0.001, h.c[2] + Math.sin(a) * h.r);
            if (i) g.lineTo(q[0], q[1]);
            else g.moveTo(q[0], q[1]);
          }
          g.closePath();
          g.fillStyle = "#3d3d48";
          g.fill();
        }
        dith.end(ctx);

        // load arrow (thrust pulling on the motor face)
        const L = b.load;
        const a0 = cam.proj(L[0], L[1] - 1.9, L[2]);
        const a1 = cam.proj(L[0], L[1] - 0.5, L[2]);
        ctx.strokeStyle = "#2e2e38";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(a0[0], a0[1]);
        ctx.lineTo(a1[0], a1[1]);
        ctx.stroke();
        const ang = Math.atan2(a1[1] - a0[1], a1[0] - a0[0]);
        ctx.beginPath();
        ctx.moveTo(a1[0], a1[1]);
        ctx.lineTo(a1[0] - 10 * Math.cos(ang - 0.4), a1[1] - 10 * Math.sin(ang - 0.4));
        ctx.lineTo(a1[0] - 10 * Math.cos(ang + 0.4), a1[1] - 10 * Math.sin(ang + 0.4));
        ctx.closePath();
        ctx.fillStyle = "#2e2e38";
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.font = `10px ${env.mono}`;
        ctx.fillText("F = 42 N", a0[0] - 26, a0[1] - 10);

        // colour bar
        if (k > 0 && W >= 520) {
          const bw = Math.min(150, W * 0.28);
          const bx = W - bw - 16;
          const by = H - 22;
          for (let i = 0; i < bw; i++) {
            ctx.fillStyle = rgba(thermalMap(i / bw), k);
            ctx.fillRect(bx + i, by, 1, 8);
          }
          ctx.fillStyle = `rgba(107,107,128,${k})`;
          ctx.font = `9px ${env.mono}`;
          ctx.fillText("VON MISES  0", bx, by - 6);
          ctx.textAlign = "right";
          ctx.fillText("200 MPA", bx + bw, by - 6);
          ctx.textAlign = "left";
        }
      },
    };
  }, []);

  const done = phase === "done";
  return (
    <div>
      <div ref={wrapRef} className="relative aspect-[4/3] w-full sm:aspect-[16/10]">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full"
          role="img"
          aria-label="A drone motor-mount bracket in CAD under a 42 newton thrust load. A finite-element mesh appears, then the predicted stress field colours the part — highest where the wall meets the base — and the wall bends slightly (exaggerated)."
        />
        <SceneHud
          kicker="Predict · structural"
          title="Motor-mount bracket"
          rows={[
            ["Max stress", done ? "182 MPa" : "—"],
            ["Deflection", done ? "0.41 mm" : "—"],
            ["Solve time", phase === "mesh" ? "meshing…" : phase === "solve" ? "predicting…" : "0.8 s  (FEA ≈ 3 h)"],
            ["Confidence", done ? "0.94" : "—"],
          ]}
          status={done ? { text: "Route: predict — no test needed", tone: "fg" } : undefined}
        />
      </div>
      <SceneHud
        below
        kicker="Predict · structural"
        title="Motor-mount bracket"
        rows={[
          ["Max stress", done ? "182 MPa" : "—"],
          ["Deflection", done ? "0.41 mm" : "—"],
          ["Solve time", phase === "mesh" ? "meshing…" : phase === "solve" ? "predicting…" : "0.8 s  (FEA ≈ 3 h)"],
          ["Confidence", done ? "0.94" : "—"],
        ]}
        status={done ? { text: "Route: predict — no test needed", tone: "fg" } : undefined}
      />
    </div>
  );
}
