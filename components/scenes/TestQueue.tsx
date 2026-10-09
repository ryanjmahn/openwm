"use client";

import { useState } from "react";
import { prism, rect } from "@/components/sims/blueprint";
import { useCanvasSim } from "@/components/sims/useCanvasSim";
import { camera, drawObjs, line3, makeDitherer } from "@/components/sims/iso3d";
import { miniPart, type PartKind } from "./parts";

/*
 * The problem, literally: a queue of prototypes feeding one expensive test rig.
 * Almost every part comes out "as predicted" — the rig hours bought nothing new.
 */
const SPEED = 0.62; // scene units / s
const GAP = 1.75;
const CH = { x0: -0.4, x1: 1.9 }; // chamber span along the belt
const BELT = { x0: -5.6, x1: 5.0 };
const HOURS_PER_TEST = 4.2;
const surprise = (n: number) => n % 6 === 4;
const START = 1.6; // part 0 begins just before the rig exit

export function TestQueue() {
  const [stats, setStats] = useState({ tests: 0, surprises: 0 });

  const { wrapRef, canvasRef } = useCanvasSim((env) => {
    const { ctx } = env;
    const chamber = [
      prism(rect(CH.x0, -1.0, CH.x1, 1.0), 0, 0.15, "#3d3d48", 3, () => 0.5),
      prism(rect(CH.x0, -1.0, CH.x1, 1.0), 0.15, 2.0, "#f4f1ea", 3, () => 0.5),
      prism(rect(CH.x0 + 0.3, -0.7, CH.x1 - 0.3, 0.7), 2.0, 2.25, "#d9d4c7", 3, () => 0.5),
    ];
    const belt = [prism(rect(BELT.x0, -0.55, BELT.x1, 0.55), 0, 0.1, "#55555f", 0, () => 0.5)];
    const dith = makeDitherer();
    let tests = 0;
    let surprises = 0;
    const stamps: { n: number; t: number }[] = [];
    let lastIdx = -1;

    return {
      frame(t) {
        const { w: W, h: H } = env;
        const S = Math.min(W / 6.8, H / 6.0);
        const cam = camera(S, 0.78, 0.6, W * 0.5, H * 0.56);
        ctx.clearRect(0, 0, W, H);
        const cell = W > 640 ? 3 : 2;
        const g = dith.begin(W, H, cell);
        const time = env.reduced ? 12000 : t;
        const travel = (time / 1000) * SPEED;

        drawObjs(g, cam, belt, { edge: 0.85, lineWidth: cell });
        // belt slats moving
        g.strokeStyle = "rgba(255,255,255,0.45)";
        g.lineWidth = cell * 0.7;
        for (let x = BELT.x0 + ((travel * 1.0) % 0.5); x < BELT.x1; x += 0.5)
          line3(g, cam, [x, -0.55, 0.1], [x, 0.55, 0.1]);

        // parts: index n sits at x = travel - n*GAP + offset
        const first = Math.max(0, Math.floor((travel + START - BELT.x1) / GAP));
        const parts: { n: number; x: number }[] = [];
        for (let n = first; n < first + 10; n++) {
          const x = travel - n * GAP + START;
          if (x < BELT.x0 + 0.3 || x > BELT.x1 - 0.2) continue;
          parts.push({ n, x });
        }
        // count completed tests (part centre passed the chamber exit)
        const done = Math.max(0, Math.floor((travel + START - CH.x1) / GAP) + 1);
        if (done !== lastIdx) {
          for (let n = Math.max(0, lastIdx); n < done; n++) {
            tests += 1;
            if (surprise(n)) surprises += 1;
            stamps.push({ n, t: time });
          }
          lastIdx = done;
          setStats({ tests, surprises });
        }

        const inside = (x: number) => x > CH.x0 + 0.2 && x < CH.x1 - 0.2;
        const before = parts.filter((p) => p.x <= CH.x0 + 0.2);
        const after = parts.filter((p) => p.x >= CH.x1 - 0.2);
        const kind = (n: number) => ((n * 7) % 4) as PartKind;
        // downstream parts are farther from the camera: draw them, then the rig, then the queue
        const o = { edge: 0.85, lineWidth: cell };
        for (const p of after) drawObjs(g, cam, miniPart(kind(p.n), p.x, 0), o);
        drawObjs(g, cam, chamber, o);
        for (const p of before) drawObjs(g, cam, miniPart(kind(p.n), p.x, 0), o);

        // chamber front window + run light
        const busy = parts.some((p) => inside(p.x));
        const w0 = cam.proj(CH.x0 + 0.5, -1.0, 0.6);
        const w1 = cam.proj(CH.x1 - 0.5, -1.0, 0.6);
        const w2 = cam.proj(CH.x1 - 0.5, -1.0, 1.55);
        const w3 = cam.proj(CH.x0 + 0.5, -1.0, 1.55);
        g.beginPath();
        g.moveTo(w0[0], w0[1]);
        g.lineTo(w1[0], w1[1]);
        g.lineTo(w2[0], w2[1]);
        g.lineTo(w3[0], w3[1]);
        g.closePath();
        g.fillStyle = busy ? `rgba(46,91,255,${0.45 + 0.25 * Math.sin(time / 200)})` : "rgba(46,46,56,0.25)";
        g.fill();
        g.strokeStyle = "#2e2e38";
        g.stroke();
        dith.end(ctx);
        const lamp = cam.proj((CH.x0 + CH.x1) / 2, 0, 2.4);
        ctx.fillStyle = busy ? "#2e5bff" : "#9a9aae";
        ctx.beginPath();
        ctx.arc(lamp[0], lamp[1], 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = `9.5px ${env.mono}`;
        ctx.fillStyle = "#2e2e38";
        const lbl = cam.proj(CH.x0 + 0.3, -1.0, 2.0);
        ctx.fillText(busy ? `TEST RIG · RUNNING · ${HOURS_PER_TEST} H` : "TEST RIG · IDLE", lbl[0] - 8, lbl[1] - 12);

        // stamps above parts that just came out
        for (let i = stamps.length - 1; i >= 0; i--) {
          const s = stamps[i];
          const age = (time - s.t) / 1000;
          if (age > 3.2) {
            stamps.splice(i, 1);
            continue;
          }
          const p = parts.find((q) => q.n === s.n);
          if (!p) continue;
          const q = cam.proj(p.x, 0, 1.0 + age * 0.15);
          const sur = surprise(s.n);
          const text = sur ? "SURPRISE → LEARN" : "AS PREDICTED";
          ctx.font = `9.5px ${env.mono}`;
          const tw = ctx.measureText(text).width + 16;
          ctx.globalAlpha = Math.min(1, (3.2 - age) * 1.5);
          ctx.fillStyle = sur ? "#2e5bff" : "#ffffff";
          ctx.strokeStyle = sur ? "#2e5bff" : "rgba(46,46,56,0.35)";
          ctx.beginPath();
          ctx.roundRect(q[0] - tw / 2, q[1] - 22, tw, 18, 9);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = sur ? "#ffffff" : "#2e2e38";
          ctx.textAlign = "center";
          ctx.fillText(text, q[0], q[1] - 9);
          ctx.textAlign = "left";
          ctx.globalAlpha = 1;
        }
      },
    };
  }, []);

  const predictable = stats.tests ? Math.round(((stats.tests - stats.surprises) / stats.tests) * 100) : 0;
  return (
    <div className="absolute inset-0 flex flex-col">
      <div
        className="t-mono relative z-10 m-4 grid grid-cols-3 gap-px self-start overflow-hidden rounded-xl border border-fg/15 bg-fg/15 text-[10px] sm:m-5"
        aria-live="off"
      >
        {[
          ["Rig time", `${(stats.tests * HOURS_PER_TEST).toFixed(1)} h`],
          ["Tests", String(stats.tests)],
          ["As predicted", stats.tests ? `${predictable}%` : "—"],
        ].map(([k, v]) => (
          <div key={k} className="bg-[#f7ecc6] px-3 py-2">
            <p className="text-fg/60">{k}</p>
            <p className="mt-0.5 text-[13px] tabular-nums text-fg">{v}</p>
          </div>
        ))}
      </div>
      <div ref={wrapRef} className="relative min-h-0 flex-1">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full"
          role="img"
          aria-label="A conveyor of hardware prototypes — heat sinks, brackets, motors, cold plates — feeds one test rig, each test taking hours. Almost every part comes out stamped 'as predicted'; only the occasional one is a surprise worth learning from."
        />
      </div>
    </div>
  );
}
