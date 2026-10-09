/** Line-art cover for the airfoil paper: an airfoil in flow, with the surrogate's
 *  over-confident prediction diverging from the real result. Drawn for grid paper. */
export function PaperCover({ className = "" }: { className?: string }) {
  // NACA 2412-ish outline
  const pts: string[] = [];
  const lo: string[] = [];
  for (let i = 0; i <= 24; i++) {
    const x = (1 - Math.cos((i / 24) * Math.PI)) / 2;
    const yt = 0.6 * (0.2969 * Math.sqrt(x) - 0.126 * x - 0.3516 * x * x + 0.2843 * x ** 3 - 0.1036 * x ** 4);
    const yc = x < 0.4 ? (0.02 / 0.16) * (0.8 * x - x * x) : (0.02 / 0.36) * (0.2 + 0.8 * x - x * x);
    pts.push(`${(60 + x * 220).toFixed(1)},${(150 - (yc + yt) * 220).toFixed(1)}`);
    lo.push(`${(60 + x * 220).toFixed(1)},${(150 - (yc - yt) * 220).toFixed(1)}`);
  }
  const foil = `M${pts.join(" L")} L${lo.reverse().join(" L")} Z`;
  return (
    <svg viewBox="0 0 400 300" className={className} fill="none" stroke="#3d72ad" strokeWidth="1.2" aria-hidden="true" preserveAspectRatio="xMidYMid meet">
      {[90, 112, 128, 172, 188, 210].map((y, i) => (
        <path
          key={y}
          d={`M-10 ${y} C 60 ${y}, 90 ${y + (y < 150 ? -14 : 10) * (1 - Math.abs(i - 2.5) / 4)}, 170 ${y + (y < 150 ? -10 : 8) * (1 - Math.abs(i - 2.5) / 4)} S 330 ${y + 6}, 410 ${y + 8}`}
          opacity={0.6}
          className="flow-dash"
        />
      ))}
      <path d={foil} fill="#ffffff" stroke="#2e2e38" strokeWidth="1.4" />
      {/* predicted vs actual, engineering-style callout */}
      <g fontFamily="var(--font-mono)" fontSize="9.5" stroke="none" letterSpacing="0.06em">
        <rect x="236" y="54" width="146" height="44" rx="6" fill="#ffffff" stroke="#2e2e38" strokeWidth="0.8" />
        <text x="246" y="72" fill="#2e2e38">
          PREDICTED L/D 94.0
        </text>
        <text x="246" y="88" fill="#c46a35">
          ACTUAL L/D 41.3
        </text>
      </g>
      <path d="M236 90 L206 128" stroke="#2e2e38" opacity="0.6" />
      <path d="M40 252 H360 M40 246 V258 M360 246 V258" stroke="#2e2e38" opacity="0.45" />
      <text x="200" y="272" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="9" fill="#6b6b80" stroke="none">
        FIG. 0 — ILLUSTRATIVE
      </text>
    </svg>
  );
}
