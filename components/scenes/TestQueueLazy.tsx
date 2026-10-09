"use client";

import dynamic from "next/dynamic";

export const TestQueueLazy = dynamic(() => import("./TestQueue").then((m) => m.TestQueue), { ssr: false });
