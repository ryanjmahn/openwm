/* Parametric hardware for the illustration scenes. Units are arbitrary "scene units". */
import { bar, makeObj, ngon, prism, rect, type Obj, type Poly, type V3 } from "@/components/sims/blueprint";

const none = () => 0.5;
const ALU = "#c9ccd4";
const ALU_LIGHT = "#dfe1e7";
const DARK = "#3d3d48";
const COPPER = "#c46a35";

/* ───────── Motor-mount bracket (structural) ───────── */
export type Bracket = { objs: Obj[]; holes: { c: V3; r: number }[]; load: V3 };

/** `defl` bends the wall forward (exaggerated deflection) for the FEA look. */
export function bracket(defl = 0): Bracket {
  const stress = (c: V3) => {
    const root = Math.exp(-((c[2] - 0.3) ** 2) / 0.35) * Math.exp(-((c[1] - 0.84) ** 2) / 0.45);
    const mid = 1 - Math.min(1, Math.abs(c[0]) / 1.9);
    const gus = c[1] < 0.84 ? Math.exp(-(c[2] - 0.3) / 0.9) * 0.8 : 0;
    return Math.min(1, root * (0.35 + 0.65 * mid) + gus * 0.6 + 0.08);
  };
  const bend = (z: number) => -defl * ((z - 0.28) / 2.2) ** 2;
  const slab = (poly: Poly, z0: number, z1: number, mat: string, layer: number) => {
    // a z-prism whose y shifts with height (cheap cantilever bend)
    const b0 = bend(z0);
    const b1 = bend(z1);
    const bot = poly.map(([x, y]) => [x, y + b0, z0] as V3);
    const top = poly.map(([x, y]) => [x, y + b1, z1] as V3);
    const faces: V3[][] = [bot, top];
    for (let i = 0; i < poly.length; i++) {
      const j = (i + 1) % poly.length;
      faces.push([bot[i], bot[j], top[j], top[i]]);
    }
    return makeObj(faces, mat, layer, stress);
  };
  const objs: Obj[] = [prism(rect(-1.7, -1.1, 1.7, 1.1), 0, 0.28, ALU, 0, stress)];
  // wall in 6 slabs so the bend reads as a curve
  const Z = [0.28, 0.65, 1.0, 1.35, 1.7, 2.1, 2.5];
  for (let i = 0; i < Z.length - 1; i++) objs.push(slab(rect(-1.7, 0.84, 1.7, 1.1), Z[i], Z[i + 1], ALU_LIGHT, 1));
  // stepped gussets (reads as printed layers / a coarse mesh)
  for (const gx of [-1.2, 1.2]) {
    const n = 7;
    for (let k = 0; k < n; k++) {
      const z0 = 0.28 + (k * 1.9) / n;
      const z1 = z0 + 1.9 / n;
      const L = 1.75 * (1 - (k + 0.5) / n);
      objs.push(slab(rect(gx - 0.08, 0.84 - L, gx + 0.08, 0.84), z0, z1, ALU, 1));
    }
  }
  const hz = 1.6;
  const hb = bend(hz);
  return {
    objs,
    holes: [
      { c: [0, 0.84 + hb, hz], r: 0.42 },
      { c: [-0.62, 0.84 + hb, hz + 0.5], r: 0.08 },
      { c: [0.62, 0.84 + hb, hz + 0.5], r: 0.08 },
      { c: [-0.62, 0.84 + hb, hz - 0.5], r: 0.08 },
      { c: [0.62, 0.84 + hb, hz - 0.5], r: 0.08 },
    ],
    load: [0, 0.84 + hb, hz],
  };
}

/* ───────── Pin-fin cold plate (thermal / fluid) ───────── */
export type Pin = { x: number; y: number; novel: boolean };
export function coldPlate(): { objs: Obj[]; pins: Pin[] } {
  const heat = (c: V3) => Math.min(1, 0.25 + (c[0] + 2.2) / 6);
  const objs: Obj[] = [prism(rect(-2.3, -1.45, 2.3, 1.45), 0, 0.32, COPPER, 0, heat)];
  // inlet / outlet manifolds
  objs.push(prism(rect(-2.6, -0.45, -2.3, 0.45), 0.05, 0.55, DARK, 0, heat));
  objs.push(prism(rect(2.3, -0.45, 2.6, 0.45), 0.05, 0.55, DARK, 0, heat));
  const pins: Pin[] = [];
  for (let i = 0; i < 8; i++)
    for (let j = 0; j < 5; j++) {
      const x = -1.9 + i * 0.54 + (j % 2) * 0.27;
      const y = -1.1 + j * 0.55;
      const novel = x > 0.95 && y > -0.4;
      pins.push({ x, y, novel });
      const poly = novel ? ngon(x, y, 0.17, 4, Math.PI / 4) : ngon(x, y, 0.11, 10);
      objs.push(prism(poly, 0.32, novel ? 1.05 : 0.92, novel ? "#e3a074" : "#d98a5a", 1, heat));
    }
  return { objs, pins };
}

/* ───────── Thrust stand + propeller (aero) ───────── */
export function thrustStand(): Obj[] {
  return [
    prism(rect(-1.5, -1.2, 1.5, 1.2), 0, 0.18, DARK, 0, none),
    prism(rect(-0.14, -0.14, 0.14, 0.14), 0.18, 2.2, ALU, 1, none),
    prism(rect(-0.42, -0.3, 0.42, 0.3), 2.2, 2.55, COPPER, 1, none),
    prism(ngon(0, 0, 0.32, 16), 2.55, 2.95, DARK, 1, none),
    prism(rect(0.75, 0.35, 1.35, 0.95), 0.18, 0.75, "#e9e6df", 1, none), // DAQ box
  ];
}
export function propeller(angle: number, blades = 3): Obj[] {
  const out: Obj[] = [prism(ngon(0, 0, 0.13, 12), 2.95, 3.12, "#2e2e38", 2, none)];
  for (let b = 0; b < blades; b++) {
    const a = angle + (b * Math.PI * 2) / blades;
    out.push(prism(bar(a, 0.1, 1.45, 0.11), 3.0, 3.07, "#f2efe6", 2, none));
  }
  return out;
}

/* ───────── Small parts for the test queue ───────── */
export type PartKind = 0 | 1 | 2 | 3;
export function miniPart(kind: PartKind, x: number, y: number, s = 0.5): Obj[] {
  const P = (poly: Poly) => poly.map(([px, py]) => [x + px * s, y + py * s] as [number, number]);
  const Z = (z: number) => 0.12 + z * s;
  switch (kind) {
    case 0: {
      // heat sink
      const o = [prism(P(rect(-1, -0.7, 1, 0.7)), Z(0), Z(0.25), ALU, 1, none)];
      for (let i = 0; i < 5; i++) {
        const fx = -0.85 + i * 0.425;
        o.push(prism(P(rect(fx - 0.05, -0.7, fx + 0.05, 0.7)), Z(0.25), Z(1.2), ALU_LIGHT, 2, none));
      }
      return o;
    }
    case 1:
      // bracket
      return [
        prism(P(rect(-0.9, -0.7, 0.9, 0.7)), Z(0), Z(0.2), ALU, 1, none),
        prism(P(rect(-0.9, 0.5, 0.9, 0.7)), Z(0.2), Z(1.3), ALU_LIGHT, 2, none),
      ];
    case 2:
      // motor + prop hub
      return [
        prism(P(ngon(0, 0, 0.55, 14)), Z(0), Z(0.7), DARK, 1, none),
        prism(P(bar(0.4, 0, 1.1, 0.12)), Z(0.7), Z(0.8), "#f2efe6", 2, none),
        prism(P(bar(0.4 + Math.PI, 0, 1.1, 0.12)), Z(0.7), Z(0.8), "#f2efe6", 2, none),
      ];
    default:
      // cold plate
      return [
        prism(P(rect(-1, -0.7, 1, 0.7)), Z(0), Z(0.3), COPPER, 1, none),
        prism(P(rect(-0.7, -0.45, 0.7, 0.45)), Z(0.3), Z(0.45), "#d98a5a", 2, none),
      ];
  }
}
