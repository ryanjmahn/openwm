import type { ReactNode } from "react";

/** A frame with four engineering-drawing corner ticks. */
export function Frame({
  children,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "figure";
}) {
  return (
    <Tag className={`frame ${className}`}>
      {children}
      <span className="tick tl" aria-hidden="true" />
      <span className="tick tr" aria-hidden="true" />
      <span className="tick bl" aria-hidden="true" />
      <span className="tick br" aria-hidden="true" />
    </Tag>
  );
}
