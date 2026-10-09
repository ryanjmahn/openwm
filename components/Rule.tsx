/** Full-width 1px hairline that draws left → right on enter. */
export function Rule({ onPaper = false }: { onPaper?: boolean }) {
  return <div className={`rule reveal-rule ${onPaper ? "on-paper" : ""}`} aria-hidden="true" />;
}
