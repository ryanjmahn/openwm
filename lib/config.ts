/**
 * Site-wide switches and contact details.
 */

// Do not ship until real numbers exist. Hide section via SHOW_METRICS=false.
export const SHOW_METRICS = process.env.NEXT_PUBLIC_SHOW_METRICS === "true";

export const SITE = {
  name: "OpenWM",
  title: "OpenWM — World models for physical intelligence",
  description:
    "OpenWM is a world model for physical design. It predicts how a design will perform, reports how confident it is, and routes only the uncertain cases to real simulation or testing.",
  url: "https://openwm.example", // [PLACEHOLDER: production domain]
  email: "team@[PLACEHOLDER].com",
};

export const SOCIALS = [
  { label: "X / Twitter", href: "#" }, // [PLACEHOLDER: handle]
  { label: "LinkedIn", href: "#" }, // [PLACEHOLDER: company page]
  { label: "GitHub", href: "#" }, // [PLACEHOLDER: org]
];

// Pilot form submissions. Swap for a Formspree endpoint or a real API.
export const PILOT_ENDPOINT = ""; // [PLACEHOLDER: Formspree / API endpoint]

// Who backs us. Logo is Todd's own wordmark (from toddagriscience.com), used as-is.
export const BACKERS = [
  {
    name: "Todd Founder Program",
    logo: "/backers/todd-wordmark.svg",
    logoAlt: "Todd",
    logoWidth: 76,
    logoHeight: 25,
    org: "Todd Agriscience",
    href: "https://toddagriscience.com/index/announcing-the-todd-founder-program",
  },
];
