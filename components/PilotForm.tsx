"use client";

import { useState, type FormEvent } from "react";
import { PILOT_ENDPOINT } from "@/lib/config";

type Values = {
  name: string;
  email: string;
  company: string;
  domain: string;
  cost: string;
  message: string;
};
type Errors = Partial<Record<keyof Values, string>>;

const EMPTY: Values = { name: "", email: "", company: "", domain: "", cost: "", message: "" };

function validate(v: Values): Errors {
  const e: Errors = {};
  if (!v.name.trim()) e.name = "Please add your name.";
  if (!v.email.trim()) e.email = "Please add an email.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) e.email = "That email doesn’t look right.";
  if (!v.company.trim()) e.company = "Please add your company or team.";
  if (!v.domain) e.domain = "Pick the closest option.";
  if (!v.cost) e.cost = "Pick the closest option.";
  if (v.message.trim().length < 20) e.message = "A sentence or two, please (20+ characters).";
  return e;
}

export function PilotForm() {
  const [v, setV] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");

  const set = (k: keyof Values) => (e: { target: { value: string } }) => {
    setV((s) => ({ ...s, [k]: e.target.value }));
    if (errors[k]) setErrors((x) => ({ ...x, [k]: undefined }));
  };

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const errs = validate(v);
    setErrors(errs);
    const first = Object.keys(errs)[0];
    if (first) {
      document.getElementById(`f-${first}`)?.focus();
      return;
    }
    setStatus("sending");
    try {
      if (PILOT_ENDPOINT) {
        const res = await fetch(PILOT_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(v),
        });
        if (!res.ok) throw new Error(String(res.status));
      } else {
        // [PLACEHOLDER: no endpoint configured — submission is not sent anywhere yet]
        await new Promise((r) => setTimeout(r, 600));
      }
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="mt-16 border-t border-line pt-10" role="status">
        <p className="t-h2">
          Thanks&thinsp;&mdash;&thinsp;we&rsquo;ll be in <em>touch</em>.
        </p>
        <p className="t-mono mt-6 text-muted">route: PREDICT · reply incoming</p>
      </div>
    );
  }

  const field = (k: keyof Values, label: string, input: React.ReactNode, hint?: string) => (
    <div className="flex flex-col">
      <label htmlFor={`f-${k}`} className="t-mono text-muted">
        {label}
      </label>
      {input}
      <p
        id={`f-${k}-err`}
        className="t-mono mt-2 min-h-[1.5em] normal-case tracking-normal text-[12px] text-fg"
        aria-live="polite"
      >
        {errors[k] ? (
          <span>
            <span className="text-blue" aria-hidden="true">
              ●{" "}
            </span>
            {errors[k]}
          </span>
        ) : (
          (hint ?? "")
        )}
      </p>
    </div>
  );
  const aria = (k: keyof Values) => ({
    id: `f-${k}`,
    name: k,
    "aria-invalid": errors[k] ? true : undefined,
    "aria-describedby": `f-${k}-err`,
    value: v[k],
    onChange: set(k),
  });

  return (
    <form onSubmit={onSubmit} noValidate className="mt-16 grid max-w-[760px] gap-x-8 gap-y-6 sm:grid-cols-2">
      {field("name", "Name", <input className="field" autoComplete="name" {...aria("name")} />)}
      {field("email", "Email", <input className="field" type="email" autoComplete="email" {...aria("email")} />)}
      <div className="sm:col-span-2">
        {field("company", "Company", <input className="field" autoComplete="organization" {...aria("company")} />)}
      </div>
      {field(
        "domain",
        "What you’re designing",
        <select className="field" {...aria("domain")}>
          <option value="" disabled>
            Select…
          </option>
          <option value="drones-aero">Drones / Aero</option>
          <option value="thermal">Thermal</option>
          <option value="other">Other</option>
        </select>,
      )}
      {field(
        "cost",
        "What one test costs today",
        <select className="field" {...aria("cost")}>
          <option value="" disabled>
            Select…
          </option>
          <option value="hours">Hours</option>
          <option value="days">Days</option>
          <option value="prototype">A prototype</option>
        </select>,
      )}
      <div className="sm:col-span-2">
        {field(
          "message",
          "The problem",
          <textarea className="field min-h-[140px] resize-y" rows={5} {...aria("message")} />,
          "What you’re optimizing, what you simulate today, and roughly how much data you have.",
        )}
      </div>
      <div className="flex flex-wrap items-center gap-6 sm:col-span-2">
        <button type="submit" className="pill dark" disabled={status === "sending"}>
          <span>{status === "sending" ? "Sending…" : "Request a pilot"}</span>
          <span className="pill-dot" aria-hidden="true">
            →
          </span>
        </button>
        {status === "error" && (
          <p className="t-mono normal-case tracking-normal text-[12px] text-fg" role="alert">
            Something went wrong sending that. Please email us instead.
          </p>
        )}
      </div>
    </form>
  );
}
