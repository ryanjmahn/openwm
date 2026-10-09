"use client";

import dynamic from "next/dynamic";
import { DitherField } from "./sims/DitherField";

const BlueprintModel = dynamic(() => import("./sims/BlueprintModel").then((m) => m.BlueprintModel), {
  ssr: false,
  loading: () => <div className="aspect-[5/4] w-full sm:aspect-[6/5]" />,
});

/** Drafting table floating in dithered clouds. */
export function HeroScene() {
  return (
    <div className="relative isolate w-full">
      <DitherField
        className="absolute inset-x-[-10%] bottom-[-4%] -z-10 h-[62%]"
        color="#d6e2f1"
        shade="#b4c9e4"
        mask="bottom"
        coverage={0.52}
        scale={0.0062}
        softness={0.14}
        seed={2}
      />
      <DitherField
        className="absolute right-[-6%] top-[2%] -z-10 h-[30%] w-[55%]"
        color="#f0e4c2"
        mask="radial"
        coverage={0.5}
        scale={0.012}
        softness={0.2}
        seed={8}
      />
      <BlueprintModel className="aspect-[5/4] sm:aspect-[6/5]" />
    </div>
  );
}
