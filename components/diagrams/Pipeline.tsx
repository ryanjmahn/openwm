/*
 * Full-width pipeline strip:
 * Design → World model → Confidence gate → (high) Ship estimate / (low) Real test → Model update
 * Drawn as an engineering line diagram; the low-confidence branch is the only blue.
 */

const mono = { fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.08em" } as const;

function Box({
  x,
  y,
  w,
  label,
  sub,
  blue = false,
}: {
  x: number;
  y: number;
  w: number;
  label: string;
  sub?: string;
  blue?: boolean;
}) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={56} stroke={blue ? "var(--blue)" : "currentColor"} fill="var(--surface)" />
      <text x={x + 12} y={y + 24} {...mono} fill="currentColor" stroke="none">
        {label.toUpperCase()}
      </text>
      {sub && (
        <text x={x + 12} y={y + 42} {...mono} fontSize={10} fill="var(--muted)" stroke="none">
          {sub}
        </text>
      )}
    </g>
  );
}

function Arrow({ d, blue = false, dashed = false }: { d: string; blue?: boolean; dashed?: boolean }) {
  return (
    <path
      d={d}
      stroke={blue ? "var(--blue)" : "currentColor"}
      strokeDasharray={dashed ? "3 4" : undefined}
      markerEnd={blue ? "url(#arr-blue)" : "url(#arr)"}
    />
  );
}

export function Pipeline({ className = "" }: { className?: string }) {
  return (
    <figure className={className}>
      {/* Desktop: horizontal strip */}
      <svg
        viewBox="0 0 1240 250"
        className="hidden w-full md:block"
        fill="none"
        strokeWidth={1}
        role="img"
        aria-labelledby="pipe-title"
      >
        <title id="pipe-title">
          Pipeline: a design goes to the world model, then a confidence gate. High confidence ships the estimate. Low
          confidence goes to a real test, whose result updates the model.
        </title>
        <defs>
          <marker id="arr" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="8" markerHeight="8" orient="auto">
            <path d="M0 0 L8 4 L0 8" fill="none" stroke="currentColor" />
          </marker>
          <marker id="arr-blue" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="8" markerHeight="8" orient="auto">
            <path d="M0 0 L8 4 L0 8" fill="none" stroke="var(--blue)" />
          </marker>
        </defs>

        <Box x={0} y={86} w={170} label="Design" sub="CAD / params" />
        <Arrow d="M170 114 H230" />
        <Box x={232} y={86} w={190} label="World model" sub="~seconds" />
        <Arrow d="M422 114 H482" />
        {/* gate */}
        <path d="M486 114 L536 64 L586 114 L536 164 Z" stroke="currentColor" fill="var(--surface)" />
        <text x={536} y={110} textAnchor="middle" {...mono} fontSize={10} fill="currentColor">
          CONF.
        </text>
        <text x={536} y={124} textAnchor="middle" {...mono} fontSize={10} fill="currentColor">
          ≥ τ ?
        </text>

        {/* high branch */}
        <Arrow d="M536 64 V30 H700" />
        <text x={560} y={22} {...mono} fontSize={10} fill="var(--muted)">
          HIGH
        </text>
        <Box x={702} y={2} w={210} label="Ship estimate" sub="no run needed" />

        {/* low branch */}
        <Arrow d="M536 164 V198 H700" blue />
        <text x={560} y={190} {...mono} fontSize={10} fill="var(--blue)">
          LOW
        </text>
        <Box x={702} y={170} w={210} label="Real test" sub="solver / bench" blue />
        <Arrow d="M912 198 H990" blue />
        <Box x={992} y={170} w={200} label="Model update" sub="+1 training point" />

        {/* feedback */}
        <Arrow d="M1092 170 V136 H327 V146" dashed />
        <text x={1084} y={128} textAnchor="end" {...mono} fontSize={10} fill="var(--muted)">
          LEARNS FROM RESULT
        </text>
        <path d="M327 146 V142" stroke="currentColor" />
      </svg>

      {/* Mobile: vertical strip */}
      <svg
        viewBox="0 0 320 500"
        className="w-full md:hidden"
        fill="none"
        strokeWidth={1}
        role="img"
        aria-labelledby="pipe-title-m"
      >
        <title id="pipe-title-m">
          Pipeline: design, world model, confidence gate. High confidence ships the estimate; low confidence goes to a
          real test, which updates the model.
        </title>
        <defs>
          <marker id="arr-m" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="8" markerHeight="8" orient="auto">
            <path d="M0 0 L8 4 L0 8" fill="none" stroke="currentColor" />
          </marker>
          <marker id="arr-mb" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="8" markerHeight="8" orient="auto">
            <path d="M0 0 L8 4 L0 8" fill="none" stroke="var(--blue)" />
          </marker>
        </defs>
        <Box x={60} y={0} w={200} label="Design" sub="CAD / params" />
        <path d="M160 56 V92" stroke="currentColor" markerEnd="url(#arr-m)" />
        <Box x={60} y={94} w={200} label="World model" sub="~seconds" />
        <path d="M160 150 V186" stroke="currentColor" markerEnd="url(#arr-m)" />
        <path d="M160 190 L205 235 L160 280 L115 235 Z" stroke="currentColor" fill="var(--surface)" />
        <text x={160} y={232} textAnchor="middle" {...mono} fontSize={10} fill="currentColor">
          CONF.
        </text>
        <text x={160} y={246} textAnchor="middle" {...mono} fontSize={10} fill="currentColor">
          ≥ τ ?
        </text>
        <path d="M115 235 H94 V318" stroke="currentColor" markerEnd="url(#arr-m)" />
        <text x={40} y={300} {...mono} fontSize={10} fill="var(--muted)">
          HIGH
        </text>
        <path d="M205 235 H250 V318" stroke="var(--blue)" markerEnd="url(#arr-mb)" />
        <text x={262} y={300} {...mono} fontSize={10} fill="var(--blue)">
          LOW
        </text>
        <Box x={24} y={320} w={140} label="Ship est." sub="no run" />
        <Box x={180} y={320} w={140} label="Real test" sub="solver / bench" blue />
        <path d="M250 376 V430" stroke="var(--blue)" markerEnd="url(#arr-mb)" />
        <Box x={180} y={432} w={140} label="Update" sub="+1 point" />
        <path d="M180 460 H8 V122 H56" stroke="currentColor" strokeDasharray="3 4" markerEnd="url(#arr-m)" />
      </svg>
    </figure>
  );
}
