/*
 * Geometry for the hero "blueprint → model" animation.
 * Tiny orthographic 3D: parts are lists of planar faces with outward normals,
 * grouped into objects that are painter-sorted by (layer, depth).
 */

export type V3 = [number, number, number];
export type Face = { pts: V3[]; n: V3; c: V3; field: number };
export type Obj = { faces: Face[]; c: V3; mat: string; layer: number; edges?: boolean };
export type Poly = [number, number][];

export type Design = {
  kind: "heatsink" | "drone" | "wing";
  title: string;
  dwg: string;
  objs: Obj[];
  /** Top-view linework for the blueprint (sheet coords). */
  plan: Poly[];
  /** Small detail view drawn in the sheet corner (local coords, ~2×1.2). */
  detail: Poly[];
  detailLabel: string;
  dims: { w: number; d: number; wLabel: string; dLabel: string; x0: number; y0: number };
  props?: V3[]; // drone prop hubs
  metric: { label: string; value: number; unit: string; digits: number };
  conf: number;
  height: number;
};

const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const centroid = (pts: V3[]): V3 => {
  const c: V3 = [0, 0, 0];
  for (const p of pts) {
    c[0] += p[0];
    c[1] += p[1];
    c[2] += p[2];
  }
  return [c[0] / pts.length, c[1] / pts.length, c[2] / pts.length];
};
function newell(pts: V3[]): V3 {
  let x = 0;
  let y = 0;
  let z = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    x += (a[1] - b[1]) * (a[2] + b[2]);
    y += (a[2] - b[2]) * (a[0] + b[0]);
    z += (a[0] - b[0]) * (a[1] + b[1]);
  }
  const m = Math.hypot(x, y, z) || 1;
  return [x / m, y / m, z / m];
}

export function makeObj(faces: V3[][], mat: string, layer: number, field: (c: V3, n: V3) => number): Obj {
  const all = faces.flat();
  const oc = centroid(all);
  return {
    mat,
    layer,
    c: oc,
    faces: faces.map((pts) => {
      let n = newell(pts);
      const c = centroid(pts);
      if (dot(n, sub(c, oc)) < 0) n = [-n[0], -n[1], -n[2]];
      return { pts, n, c, field: field(c, n) };
    }),
  };
}

/** Extrude a 2D polygon (xy) between z0 and z1. */
export function prism(poly: Poly, z0: number, z1: number, mat: string, layer: number, field: (c: V3, n: V3) => number) {
  const bot = poly.map(([x, y]) => [x, y, z0] as V3);
  const top = poly.map(([x, y]) => [x, y, z1] as V3);
  const faces: V3[][] = [bot, top];
  for (let i = 0; i < poly.length; i++) {
    const j = (i + 1) % poly.length;
    faces.push([bot[i], bot[j], top[j], top[i]]);
  }
  return makeObj(faces, mat, layer, field);
}

export const rect = (x0: number, y0: number, x1: number, y1: number): Poly => [
  [x0, y0],
  [x1, y0],
  [x1, y1],
  [x0, y1],
];
export const ngon = (cx: number, cy: number, r: number, n: number, rot = 0): Poly =>
  Array.from({ length: n }, (_, i) => {
    const a = rot + (i / n) * Math.PI * 2;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  });
export const bar = (a: number, r0: number, r1: number, w: number): Poly => {
  const c = Math.cos(a);
  const s = Math.sin(a);
  const nx = -s * w;
  const ny = c * w;
  return [
    [c * r0 - nx, s * r0 - ny],
    [c * r1 - nx, s * r1 - ny],
    [c * r1 + nx, s * r1 + ny],
    [c * r0 + nx, s * r0 + ny],
  ];
};

function naca(chord: number, m: number, p: number, t: number, n = 16): Poly {
  const up: [number, number][] = [];
  const lo: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const x = (1 - Math.cos((i / n) * Math.PI)) / 2;
    const yt = 5 * t * (0.2969 * Math.sqrt(x) - 0.126 * x - 0.3516 * x * x + 0.2843 * x ** 3 - 0.1036 * x ** 4);
    const yc = x < p ? (m / (p * p)) * (2 * p * x - x * x) : (m / (1 - p) ** 2) * (1 - 2 * p + 2 * p * x - x * x);
    up.push([(x - 0.3) * chord, (yc + yt) * chord]);
    lo.push([(x - 0.3) * chord, (yc - yt) * chord]);
  }
  return [...up, ...lo.reverse().slice(1, -1)];
}

const rnd = (a: number, b: number, r: () => number) => a + (b - a) * r();

/* ───────────────────────── designs ───────────────────────── */

function heatsink(r: () => number, n: number): Design {
  const fins = Math.round(rnd(5, 9, r));
  const h = rnd(1.5, 2.5, r);
  const W = 5.2;
  const D = 3.2;
  const base = 0.34;
  const top = base + h;
  const field = (c: V3) => Math.min(1, Math.max(0, 1 - (c[2] / top) * 0.8 - (Math.abs(c[0]) / (W / 2)) * 0.25));
  const objs: Obj[] = [prism(rect(-W / 2, -D / 2, W / 2, D / 2), 0, base, "#c9ccd4", 0, field)];
  const plan: Poly[] = [rect(-W / 2, -D / 2, W / 2, D / 2)];
  const fw = 0.16;
  for (let i = 0; i < fins; i++) {
    const x = -W / 2 + 0.2 + (i * (W - 0.4)) / (fins - 1);
    objs.push(prism(rect(x - fw / 2, -D / 2, x + fw / 2, D / 2), base, top, "#d7d9e0", 1, field));
    plan.push(rect(x - fw / 2, -D / 2, x + fw / 2, D / 2));
  }
  // heat source footprint (dashed in plan)
  plan.push(rect(-0.8, -0.8, 0.8, 0.8));
  const detail: Poly[] = [rect(0, 0, 2, 0.17)];
  for (let i = 0; i < fins; i++) {
    const x = 0.1 + (i * 1.8) / (fins - 1);
    detail.push(rect(x - 0.03, 0.17, x + 0.03, 0.17 + h * 0.4));
  }
  const dist = Math.hypot((fins - 7) / 2, (h - 2) / 0.5);
  return {
    kind: "heatsink",
    title: `Heat sink · ${fins} fins`,
    dwg: `DWG-${String(n).padStart(3, "0")}`,
    objs,
    plan,
    detail,
    detailLabel: "ELEV. A",
    dims: { w: W, d: D, wLabel: (W * 10).toFixed(1), dLabel: (D * 10).toFixed(1), x0: -W / 2, y0: -D / 2 },
    metric: { label: "Peak temp", value: 48 + 120 / (fins * h * 1.2), unit: "°C", digits: 1 },
    conf: Math.max(0.55, 0.97 - dist * 0.09),
    height: top,
  };
}

function drone(r: () => number, n: number): Design {
  const L = rnd(1.9, 2.6, r);
  const field = (c: V3) => Math.max(0, 1 - Math.hypot(c[0], c[1]) / L);
  const objs: Obj[] = [];
  const plan: Poly[] = [];
  const oct = ngon(0, 0, 0.78, 8, Math.PI / 8);
  objs.push(prism(oct, 0.28, 0.44, "#3d3d48", 0, field));
  plan.push(oct);
  const props: V3[] = [];
  for (let k = 0; k < 4; k++) {
    const a = Math.PI / 4 + (k * Math.PI) / 2;
    const arm = bar(a, 0.5, L, 0.12);
    objs.push(prism(arm, 0.3, 0.44, "#4a4a56", 0, field));
    plan.push(arm);
    const mx = Math.cos(a) * L;
    const my = Math.sin(a) * L;
    const motor = ngon(mx, my, 0.22, 12);
    objs.push(prism(motor, 0.24, 0.72, "#c9ccd4", 1, field));
    plan.push(motor, ngon(mx, my, 0.85, 28));
    props.push([mx, my, 0.8]);
  }
  const batt = rect(-0.45, -0.24, 0.45, 0.24);
  objs.push(prism(batt, 0.44, 0.74, "#c46a35", 1, field));
  plan.push(batt);
  const detail: Poly[] = [ngon(0.5, 0.5, 0.45, 24), ngon(0.5, 0.5, 0.12, 12), rect(1.2, 0.42, 2, 0.58)];
  const dist = Math.abs(L - 2.15) / 0.18;
  return {
    kind: "drone",
    title: `Quad frame · ${(L * 2 * 52).toFixed(0)} mm`,
    dwg: `DWG-${String(n).padStart(3, "0")}`,
    objs,
    plan,
    detail,
    detailLabel: "MOTOR MT.",
    dims: {
      w: L * 1.414,
      d: L * 1.414,
      wLabel: (L * 14.1).toFixed(1),
      dLabel: (L * 14.1).toFixed(1),
      x0: -L * 0.707,
      y0: -L * 0.707,
    },
    props,
    metric: { label: "Hover eff.", value: 9.6 - L * 0.9, unit: "g/W", digits: 2 },
    conf: Math.max(0.55, 0.96 - dist * 0.1),
    height: 0.9,
  };
}

function wing(r: () => number, n: number): Design {
  const c0 = rnd(1.9, 2.5, r);
  const taper = rnd(0.55, 0.95, r);
  const span = 4.6;
  const zOff = 0.95;
  const camber = rnd(0.02, 0.06, r);
  const root = naca(c0, camber, 0.4, 0.13);
  const tip = naca(c0 * taper, camber, 0.4, 0.13);
  const A = root.map(([x, z]) => [x, -span / 2, z + zOff] as V3);
  const B = tip.map(([x, z]) => [x + (c0 - c0 * taper) * 0.12, span / 2, z + zOff] as V3);
  const faces: V3[][] = [A, B];
  for (let i = 0; i < A.length; i++) {
    const j = (i + 1) % A.length;
    faces.push([A[i], A[j], B[j], B[i]]);
  }
  const field = (c: V3, nn: V3) => {
    const lead = Math.exp(-((c[0] + c0 * 0.25) ** 2) / 0.3);
    return nn[2] > 0 ? 0.42 - 0.38 * lead : 0.58 + 0.38 * lead;
  };
  const objs: Obj[] = [makeObj(faces, "#eceef2", 1, field)];
  for (const y of [-1.4, 1.4]) objs.push(prism(rect(-0.08, y - 0.08, 0.08, y + 0.08), 0, zOff, "#4a4a56", 0, () => 0.5));
  objs.push(prism(rect(-0.5, -1.7, 0.5, 1.7), 0, 0.12, "#3d3d48", 0, () => 0.5));
  const xs = root.map((p) => p[0]);
  const plan: Poly[] = [
    [
      [Math.min(...xs), -span / 2],
      [Math.max(...xs), -span / 2],
      [Math.max(...xs) * taper + (c0 - c0 * taper) * 0.12, span / 2],
      [Math.min(...xs) * taper + (c0 - c0 * taper) * 0.12, span / 2],
    ],
    rect(-0.5, -1.7, 0.5, 1.7),
  ];
  const detail: Poly[] = [naca(2, camber, 0.4, 0.13).map(([x, z]) => [x + 0.6, z * 1.6 + 0.4])];
  const dist = Math.hypot((taper - 0.75) / 0.12, (camber - 0.04) / 0.012);
  return {
    kind: "wing",
    title: `Wing section · λ ${taper.toFixed(2)}`,
    dwg: `DWG-${String(n).padStart(3, "0")}`,
    objs,
    plan,
    detail,
    detailLabel: "SECTION B-B",
    dims: {
      w: c0,
      d: span,
      wLabel: (c0 * 10).toFixed(1),
      dLabel: (span * 10).toFixed(1),
      x0: Math.min(...xs),
      y0: -span / 2,
    },
    metric: { label: "Pred. L/D", value: 18 + camber * 260 + taper * 4, unit: "", digits: 1 },
    conf: Math.max(0.55, 0.97 - dist * 0.08),
    height: zOff + 0.4,
  };
}

const MAKERS = [heatsink, drone, wing];

export function makeDesign(index: number, r: () => number = Math.random): Design {
  return MAKERS[index % MAKERS.length](r, index + 1);
}
