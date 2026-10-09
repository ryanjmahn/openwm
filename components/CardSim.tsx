"use client";

import dynamic from "next/dynamic";

const load = <K extends string>(k: K) => dynamic(() => import("./sims/CardSims").then((m) => m[k as keyof typeof m] as React.ComponentType<{ className?: string }>), { ssr: false });
const PropWake = load("PropWake");
const ResponseSurface = load("ResponseSurface");
const Tissue = load("Tissue");
const Bioreactor = load("Bioreactor");
const ProteinFold = load("ProteinFold");
const WellPlate = load("WellPlate");
const Truss = load("Truss");
const ThermalSim = dynamic(() => import("./sims/ThermalSim").then((m) => m.ThermalSim), { ssr: false });

export type CardKind = "prop" | "thermal" | "truss" | "surface" | "tissue" | "bioreactor" | "protein" | "plate";

export function CardSim({ kind }: { kind: CardKind }) {
  switch (kind) {
    case "prop":
      return <PropWake className="absolute inset-0" />;
    case "thermal":
      return <ThermalSim compact className="absolute inset-3 overflow-hidden rounded-xl" />;
    case "truss":
      return <Truss className="absolute inset-0" />;
    case "surface":
      return <ResponseSurface className="absolute inset-0" />;
    case "tissue":
      return <Tissue className="absolute inset-0" />;
    case "bioreactor":
      return <Bioreactor className="absolute inset-0" />;
    case "protein":
      return <ProteinFold className="absolute inset-0" />;
    case "plate":
      return <WellPlate className="absolute inset-0" />;
  }
}
