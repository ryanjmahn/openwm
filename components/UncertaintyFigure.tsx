"use client";

import dynamic from "next/dynamic";

const UncertaintySim = dynamic(() => import("./sims/UncertaintySim").then((m) => m.UncertaintySim), {
  ssr: false,
  loading: () => <div className="aspect-[16/10] w-full rounded-xl bg-base" />,
});

/** Interactive figure for MDX posts. */
export function UncertaintyFigure() {
  return <UncertaintySim />;
}
