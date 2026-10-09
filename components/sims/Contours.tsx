"use client";

import { fbm } from "./color";
import { useCanvasSim } from "./useCanvasSim";

/**
 * Topographic contour lines (marching squares over slowly drifting noise) —
 * the quiet counterpart to the dithered clouds.
 */
export function Contours({
  className = "",
  color = "#2e2e38",
  levels = 11,
  scale = 0.0045,
  seed = 1,
  opacity = 0.5,
  speed = 1,
}: {
  className?: string;
  color?: string;
  levels?: number;
  scale?: number;
  seed?: number;
  opacity?: number;
  speed?: number;
}) {
  const { wrapRef, canvasRef } = useCanvasSim(
    (env) => {
      const { ctx } = env;
      let acc = 0;
      return {
        frame(t, dt) {
          acc += dt;
          if (dt !== 0 && acc < 70) return; // ~14fps is plenty
          acc = 0;
          const { w: W, h: H } = env;
          const cell = 7;
          const gw = Math.ceil(W / cell) + 1;
          const gh = Math.ceil(H / cell) + 1;
          const drift = t * 0.000025 * speed;
          const f = new Float32Array(gw * gh);
          for (let j = 0; j < gh; j++)
            for (let i = 0; i < gw; i++) f[j * gw + i] = fbm(i * cell * scale + drift, j * cell * scale - drift * 0.6, seed, 3);
          ctx.clearRect(0, 0, W, H);
          ctx.strokeStyle = color;
          ctx.lineWidth = 1;
          for (let l = 1; l <= levels; l++) {
            const L = 0.18 + (l / (levels + 1)) * 0.64;
            ctx.globalAlpha = opacity * (l % 4 === 0 ? 1 : 0.55);
            ctx.beginPath();
            for (let j = 0; j < gh - 1; j++)
              for (let i = 0; i < gw - 1; i++) {
                const a = f[j * gw + i];
                const b = f[j * gw + i + 1];
                const c = f[(j + 1) * gw + i + 1];
                const d = f[(j + 1) * gw + i];
                const k = (a > L ? 8 : 0) | (b > L ? 4 : 0) | (c > L ? 2 : 0) | (d > L ? 1 : 0);
                if (k === 0 || k === 15) continue;
                const x = i * cell;
                const y = j * cell;
                const top = () => [x + ((L - a) / (b - a)) * cell, y] as const;
                const right = () => [x + cell, y + ((L - b) / (c - b)) * cell] as const;
                const bottom = () => [x + ((L - d) / (c - d)) * cell, y + cell] as const;
                const left = () => [x, y + ((L - a) / (d - a)) * cell] as const;
                const seg = (p: readonly [number, number], q: readonly [number, number]) => {
                  ctx.moveTo(p[0], p[1]);
                  ctx.lineTo(q[0], q[1]);
                };
                switch (k) {
                  case 1:
                  case 14:
                    seg(left(), bottom());
                    break;
                  case 2:
                  case 13:
                    seg(bottom(), right());
                    break;
                  case 3:
                  case 12:
                    seg(left(), right());
                    break;
                  case 4:
                  case 11:
                    seg(top(), right());
                    break;
                  case 5:
                    seg(left(), top());
                    seg(bottom(), right());
                    break;
                  case 6:
                  case 9:
                    seg(top(), bottom());
                    break;
                  case 7:
                  case 8:
                    seg(left(), top());
                    break;
                  case 10:
                    seg(top(), right());
                    seg(left(), bottom());
                    break;
                }
              }
            ctx.stroke();
          }
          ctx.globalAlpha = 1;
        },
      };
    },
    [color, levels, scale, seed, opacity, speed],
  );
  return (
    <div ref={wrapRef} className={`pointer-events-none ${className}`} aria-hidden="true">
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
