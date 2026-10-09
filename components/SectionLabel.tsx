/** Mono journal label: `§01 — THESIS`. */
export function SectionLabel({ n, name, className = "" }: { n?: string; name: string; className?: string }) {
  return (
    <p className={`t-mono reveal ${className}`}>
      {n && <span>§{n}</span>}
      {n && <span className="opacity-60"> — </span>}
      <span>{name}</span>
    </p>
  );
}
