"use client";

import { BAYER8, fbm, hex } from "./color";
import { useCanvasSim } from "./useCanvasSim";

type Mask = "none" | "bottom" | "top" | "radial" | "band";

/**
 * Animated Bayer-dithered noise — the site's "cloud" texture.
 * Renders at 1 texel per `cell` CSS px and upscales without smoothing, so the
 * dots stay crisp and the cost stays tiny.
 */
export function DitherField({
  className = "",
  color = "#2e2e38",
  shade,
  cell = 4,
  scale = 0.012,
  speed = 0.012,
  coverage = 0.5,
  softness = 0.22,
  mask = "none",
  seed = 1,
  opacity = 1,
  octaves = 3,
  fadeX = true,
}: {
  className?: string;
  color?: string;
  /** Optional second colour for the densest regions (cloud "shadow"). */
  shade?: string;
  cell?: number;
  scale?: number;
  speed?: number;
  coverage?: number;
  softness?: number;
  mask?: Mask;
  seed?: number;
  opacity?: number;
  octaves?: number;
  /** Soften the left/right edges (on by default for masked fields). */
  fadeX?: boolean;
}) {
  const { wrapRef, canvasRef } = useCanvasSim(
    (env) => {
      const off = document.createElement("canvas");
      const octx = off.getContext("2d")!;
      let img: ImageData;
      let gw = 1;
      let gh = 1;
      const c1 = hex(color);
      const c2 = shade ? hex(shade) : c1;
      const resize = () => {
        gw = Math.max(1, Math.ceil(env.w / cell));
        gh = Math.max(1, Math.ceil(env.h / cell));
        off.width = gw;
        off.height = gh;
        img = octx.createImageData(gw, gh);
      };
      resize();
      let acc = 0;
      return {
        resize,
        frame(t, dt) {
          // ~30fps is plenty for drifting clouds
          acc += dt;
          if (dt !== 0 && acc < 32) return;
          acc = 0;
          const d = img.data;
          const drift = t * speed * 0.06;
          const sc = scale * cell;
          for (let y = 0; y < gh; y++) {
            const ny = y / gh;
            let m = 1;
            if (mask === "bottom") m = Math.min(1, Math.max(0, (ny - 0.15) / 0.55));
            else if (mask === "top") m = Math.min(1, Math.max(0, (0.85 - ny) / 0.55));
            else if (mask === "band") m = Math.max(0, 1 - Math.abs(ny - 0.5) / 0.5);
            for (let x = 0; x < gw; x++) {
              let mm = m;
              if (mask === "radial") {
                const dx = x / gw - 0.5;
                const dy = ny - 0.5;
                mm = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy) * 2);
              }
              if (fadeX && mask !== "none" && mask !== "radial") {
                const ex = Math.min(x, gw - 1 - x) / (gw * 0.16);
                if (ex < 1) mm *= ex;
              }
              const n = fbm(x * sc + drift, y * sc * 1.6 - drift * 0.3, seed, octaves);
              const v = Math.min(1, Math.max(0, (n - (1 - coverage)) / softness)) * mm;
              const th = BAYER8[(y & 7) * 8 + (x & 7)];
              const i = (y * gw + x) * 4;
              if (v > th) {
                const dense = shade && v > 0.82 && th < 0.5;
                const c = dense ? c2 : c1;
                d[i] = c[0];
                d[i + 1] = c[1];
                d[i + 2] = c[2];
                d[i + 3] = 255;
              } else d[i + 3] = 0;
            }
          }
          octx.putImageData(img, 0, 0);
          const { ctx } = env;
          ctx.clearRect(0, 0, env.w, env.h);
          ctx.imageSmoothingEnabled = false;
          ctx.globalAlpha = opacity;
          ctx.drawImage(off, 0, 0, gw * cell, gh * cell);
          ctx.globalAlpha = 1;
        },
      };
    },
    [color, shade, cell, scale, speed, coverage, softness, mask, seed, opacity, octaves, fadeX],
    { maxDpr: 1 },
  );
  return (
    <div ref={wrapRef} className={`pointer-events-none ${className}`} aria-hidden="true">
      <canvas ref={canvasRef} className="block h-full w-full [image-rendering:pixelated]" />
    </div>
  );
}
