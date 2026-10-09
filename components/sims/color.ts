/* Colour helpers + scientific colormaps tuned for a light page. */

export type RGB = [number, number, number];

export const hex = (h: string): RGB => {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

function ramp(stops: string[]) {
  const c = stops.map(hex);
  return (t: number): RGB => {
    const x = Math.min(0.99999, Math.max(0, t)) * (c.length - 1);
    const i = Math.floor(x);
    const f = x - i;
    const a = c[i];
    const b = c[i + 1];
    return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
  };
}

/** Diverging pressure map: suction (teal) → freestream (cream) → stagnation (copper/oxblood). */
export const pressureMap = ramp(["#1f7f86", "#5fb3a6", "#cfe5d6", "#fbf6ea", "#f2c99a", "#d9814a", "#9c3b25"]);
/** Thermal map on light: cool cream → amber → copper → plum. */
export const thermalMap = ramp(["#f4f1ea", "#f6e2a8", "#f2b766", "#e07b45", "#b8443a", "#6e2346"]);
/** Height map for response surfaces. */
export const terrainMap = ramp(["#2b5d93", "#3d8fa0", "#7cc0a0", "#e9d79a", "#e39a5a", "#c25a3a"]);

export const rgba = (c: RGB, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;

/** 8×8 Bayer matrix, normalised to (0,1). */
export const BAYER8 = (() => {
  const m = [
    0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26, 12, 44, 4, 36, 14, 46, 6, 38, 60, 28, 52, 20, 62, 30,
    54, 22, 3, 35, 11, 43, 1, 33, 9, 41, 51, 19, 59, 27, 49, 17, 57, 25, 15, 47, 7, 39, 13, 45, 5, 37, 63, 31, 55, 23,
    61, 29, 53, 21,
  ];
  return Float32Array.from(m, (v) => (v + 0.5) / 64);
})();

/* Value noise + fbm (deterministic, no deps). */
function hash(x: number, y: number, s: number) {
  let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}
export function noise2(x: number, y: number, seed = 0) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi, seed);
  const b = hash(xi + 1, yi, seed);
  const c = hash(xi, yi + 1, seed);
  const d = hash(xi + 1, yi + 1, seed);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
export function fbm(x: number, y: number, seed = 0, oct = 4) {
  let s = 0;
  let amp = 0.5;
  let f = 1;
  for (let i = 0; i < oct; i++) {
    s += amp * noise2(x * f, y * f, seed + i * 17);
    f *= 2;
    amp *= 0.5;
  }
  return s / (1 - Math.pow(0.5, oct));
}
