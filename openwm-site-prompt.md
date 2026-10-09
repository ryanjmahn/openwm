# Build Prompt — OpenWM Website

> Paste this whole file into your coding agent. It is the full spec. Where it says **[PLACEHOLDER]**, leave a clearly marked stub — never invent numbers, customers, logos, investors, or quotes.

---

## 0. Your role

You are a senior design engineer building the marketing site for **OpenWM**, an early-stage AI company. You care about typography, restraint, and motion that *means* something. You will build a fast, accessible, production-ready site from this spec, make sensible decisions where it is silent, and list those decisions at the end.

Work in this order: (1) scaffold + design tokens, (2) static layout of every section with real copy, (3) the signature hero interaction, (4) motion polish, (5) responsive + accessibility pass, (6) the acceptance checklist in §13.

---

## 1. Company brief (source of truth for all copy)

- **Name:** OpenWM
- **Category:** World models for physical intelligence.
- **One-liner:** An AI engineer that predicts how a design will perform — and only runs the expensive real test when it's unsure.
- **Positioning:** The *pre-research verification layer*. Before a team spends hours of compute or builds a physical prototype, OpenWM predicts the outcome, reports how confident it is, and routes only the uncertain cases to real simulation or testing. Result: lower upfront simulation cost, faster iteration, and a culture where verification is the default rather than an afterthought.
- **Who it's for:** Small and mid-size hardware teams for whom a single test costs hours, days, or a physical prototype (initial focus: drone and thermal / cooling hardware). Enterprise-only tools exist; OpenWM is built for teams without an enterprise simulation budget.
- **Future direction (mention lightly, once):** the same predict-then-verify loop extends beyond mechanical design — e.g. biology (virtual cells, protein engineering, bioprocessing).
- **Research credibility:** The team has written a paper, *"Surrogate Hacking in LLM-Driven Airfoil Design"* — about how optimizers (including LLM agents) learn to exploit a surrogate model's blind spots instead of finding genuinely better designs. This is the *reason* OpenWM exists: a surrogate you can't trust is worse than none, so uncertainty must gate every prediction. Use this as the intellectual backbone of the site.
- **Stage:** Early. Tone should be confident and precise, never inflated. No fake metrics, no fake logos.

**Core idea to make visible everywhere:** *Predict → Measure confidence → Verify only when unsure.*

---

## 2. Design direction — a fusion, not a copy

Two references. Borrow **principles**, not assets, layouts pixel-for-pixel, logos, or copy.

| From **World Labs** (worldlabs.ai) | From **Founders, Inc.** (f.inc) |
|---|---|
| Calm, research-lab confidence; lots of air | Dense, information-rich grid when it matters |
| Small announcement pill above the hero linking to the latest post | Tag chips on cards (e.g. `AI/ML` `Hardware`) |
| Big declarative statement section that reads like a thesis | A personal, first-person letter section from the founders |
| Product capabilities as a clean numbered/listed feature set | Strong, blunt CTA block ("Tell us what you're building") |
| "Research & Insights" row of dated cards | Live local clock in the footer; footer as a dense link grid |
| A single illustrative image anchoring the footer | Mono/utility labels, a slightly engineered, "campus/lab" feel |

**What makes OpenWM its own thing:**
1. **Black-first palette** with occasional full-bleed white "paper" sections for rhythm (both references are light; we invert).
2. **Instrument Serif** at very large sizes for display, italic used deliberately for *the one word that matters* in a headline.
3. **Blue means uncertainty.** Blue is not decoration. It is the visual language for "the model isn't sure — verify here." Use it on the hero visualization, on confidence indicators, on the primary CTA, and almost nowhere else.
4. **Engineering-drawing details:** hairline rules, corner tick marks on frames, coordinate-style mono labels (`§01`, `FIG. 2`, `σ = 0.12`), dimension lines. Think technical blueprint meets research journal.

---

## 3. Design tokens

```css
:root {
  /* Color */
  --ink:        #0A0A0A;  /* page background (black) */
  --ink-2:      #121212;  /* raised surfaces */
  --line:       #262626;  /* hairlines on black */
  --paper:      #F4F3EF;  /* off-white for inverted sections + primary text on black */
  --paper-dim:  #A3A3A0;  /* secondary text on black */
  --paper-line: #D9D7D0;  /* hairlines on paper */
  --blue:       #2E5BFF;  /* uncertainty / action */
  --blue-soft:  rgba(46, 91, 255, 0.14);
  --blue-glow:  rgba(46, 91, 255, 0.35);

  /* Type */
  --font-display: "Instrument Serif", ui-serif, Georgia, serif;
  --font-body:    "Inter", ui-sans-serif, system-ui, sans-serif; /* or Geist */
  --font-mono:    "JetBrains Mono", ui-monospace, monospace;     /* or Geist Mono */

  /* Spacing (4px base) */
  --s-1: 4px; --s-2: 8px; --s-3: 12px; --s-4: 16px; --s-6: 24px;
  --s-8: 32px; --s-12: 48px; --s-16: 64px; --s-24: 96px; --s-32: 128px;

  /* Layout */
  --maxw: 1360px;
  --gutter: clamp(16px, 4vw, 48px);
  --radius: 2px;   /* near-square. No pill buttons except the announcement pill. */

  /* Motion */
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --dur-1: 160ms; --dur-2: 320ms; --dur-3: 700ms;
}
```

Rules:
- Text on black is `--paper`, never pure `#FFF`. Black is `--ink`, never pure `#000`.
- Blue appears on **at most ~5% of any viewport.** If you're tempted to add blue for style, don't.
- No gradients except the soft blue glow inside the hero visualization.
- No drop shadows. Depth comes from hairlines and contrast.

---

## 4. Typography

Load **Instrument Serif** (regular + italic) from Google Fonts via `next/font/google` (or `<link>` if not Next). Instrument Serif only has a regular weight — never fake bold it.

| Role | Font | Size (desktop → mobile) | Notes |
|---|---|---|---|
| Hero display | Instrument Serif | `clamp(56px, 9vw, 152px)` | line-height 0.95, letter-spacing -0.02em |
| Section display (H2) | Instrument Serif | `clamp(40px, 5.5vw, 88px)` | line-height 1.0 |
| Statement / thesis | Instrument Serif | `clamp(32px, 4.2vw, 64px)` | line-height 1.1, max ~22ch per line |
| H3 / card titles | Instrument Serif | 28–32px | |
| Body | Inter | 17px / 1.6 | max-width 62ch, `--paper-dim` for secondary |
| Labels, tags, meta | JetBrains Mono | 11–12px uppercase, letter-spacing 0.08em | section numbers, dates, chips |

Italic rule: in each display headline, italicize **one** key word (e.g. "only when it's *unsure*"). Never italicize whole sentences.

---

## 5. Layout system

- 12-column grid inside `--maxw`, gutters `--gutter`. Most sections are asymmetric: label column (cols 1–3, mono `§0X — NAME`) + content (cols 4–12). This is the "journal" structure.
- Every section separated by a full-width 1px hairline (`--line` on black, `--paper-line` on paper).
- Frames (images, the hero canvas, cards) get **corner tick marks**: four 10px L-shaped marks at the corners, 1px, `--paper-dim`. Build as a reusable `<Frame>` component.
- Vertical rhythm: sections `padding-block: var(--s-32)` desktop, `var(--s-16)` mobile.

---

## 6. Page structure — Home (`/`)

Build these sections in order. Copy below is a strong first draft; keep it unless you have a better line that says the same thing more precisely.

### 6.1 Nav (sticky, transparent → `--ink` with hairline after 24px scroll)
- Left: wordmark **OpenWM** in Instrument Serif, 24px. (No logo image — typographic only for now.)
- Center/right links (Inter 14px): `Approach` · `Research` · `About` · `Careers`
- Right: primary button **Request a pilot** (blue fill, `--paper` text, 2px radius).
- Mobile: hamburger → full-screen black sheet with links set large in Instrument Serif.

### 6.2 Announcement pill (World Labs pattern)
Small pill above the headline, hairline border, mono 11px:
`NEW — Surrogate Hacking in LLM-Driven Airfoil Design →` linking to the research post.

### 6.3 Hero
- Headline (Instrument Serif, huge):
  **"Predict the test. Run it only when you're *unsure*."**
- Sub (Inter 19px, `--paper-dim`, max 52ch):
  "OpenWM is a world model for physical design. It forecasts how a part will perform, tells you how confident it is, and sends only the uncertain cases to real simulation."
- CTAs: **Request a pilot** (blue) · **Read the research** (text link with → arrow, hairline underline that animates on hover).
- Below/right of the copy: the **Confidence Gate** visualization (§7) inside a `<Frame>` with mono captions: `FIG. 1 — LIVE PREDICTION`, and a small readout `confidence 0.94 · route: PREDICT`.

### 6.4 §01 — Thesis statement (World Labs "big statement" pattern)
Full-width, Instrument Serif ~64px, left-aligned, on black:
> "Most simulation spend goes to tests whose answer was already predictable. The expensive part isn't computing — it's not knowing *which* runs actually matter."

Under it, a short Inter paragraph and a text link "How it works →".

### 6.5 §02 — How it works (inverted: `--paper` background, `--ink` text)
Three columns, each numbered with large serif numerals `1 2 3` and a mono label, separated by vertical hairlines. Each has a small diagram (inline SVG, line-art, black with one blue accent):
1. **Predict** — "A world model trained on your past designs and simulations estimates performance in seconds."
2. **Measure doubt** — "Every prediction carries a calibrated uncertainty. No silent guesses."
3. **Verify selectively** — "When confidence drops below your threshold, OpenWM routes the design to your real solver or bench test — and learns from the result."

Then a single horizontal **pipeline strip** across the full width: `Design → World model → Confidence gate → (high) Ship estimate / (low) Real test → Model update`, drawn as an engineering line diagram with the low-confidence branch in blue.

### 6.6 §03 — Why uncertainty first (research-backed)
Two-column. Left: Instrument Serif H2 **"A surrogate you can't trust is worse than none."** Right: 2 short paragraphs explaining surrogate hacking in plain language — optimizers find designs that look great to the model but fail in reality; uncertainty gating is the fix. Then a card linking to the paper (title, authors **[PLACEHOLDER: author list]**, venue **[PLACEHOLDER: venue/status]**, `Read paper →`).

### 6.7 §04 — Built for (f.inc tag-chip pattern)
Grid of 3–4 cards with hairline borders, each with mono tag chips at top:
- `DRONES` `AERO` — "Airframes and propellers: screen hundreds of geometries before a single CFD run."
- `THERMAL` `HARDWARE` — "Heat sinks and cooling loops: predict thermal performance before you machine a prototype."
- `SMALL TEAMS` — "No enterprise simulation budget required. Start with the data you already have."
- `NEXT` `BIOLOGY` (dimmed / "later" state) — "The same predict-then-verify loop, applied to cells, proteins, and bioprocesses."
Cards: hover lifts the hairline to `--paper` and reveals a blue 2px left rule. No shadows.

### 6.8 §05 — Numbers strip
A row of 3 large Instrument Serif figures with mono captions — **all placeholders**, visibly marked in dev:
`[PLACEHOLDER]% fewer simulation runs` · `[PLACEHOLDER]× faster design iteration` · `[PLACEHOLDER] teams in pilot`.
Add a code comment: `// Do not ship until real numbers exist. Hide section via SHOW_METRICS=false.` Default the flag to **false**.

### 6.9 §06 — A note from the founders (f.inc letter pattern)
Inverted paper section. Left column: mono label + a small **[PLACEHOLDER: team photo]** inside a `<Frame>`. Right column: a first-person letter in Inter 19px, ~150 words, signed in Instrument Serif italic. Draft:

> We started OpenWM after watching good engineering teams burn weeks on simulations whose answers they could have guessed — and then, just as often, trust a fast model that was quietly wrong.
>
> We think the fix is a model that knows what it doesn't know. One that predicts when it can, says so when it can't, and makes verification a habit instead of an afterthought.
>
> We're building it first for hardware teams who can't afford to test everything, and can't afford to test the wrong thing. If that's you, we'd like to hear what you're building.
>
> — *The OpenWM team*

### 6.10 §07 — Research & notes (World Labs pattern)
Row of 3 dated cards (mono date, serif title, one-line Inter dek, `→`). First card = the airfoil paper. Others: **[PLACEHOLDER]** posts. Source these from a local `content/posts/*.mdx` folder so new posts are easy to add. "All research →" link.

### 6.11 §08 — CTA block (f.inc pattern)
Big black section. Instrument Serif H2: **"Tell us what you're *testing*."** Sub: "Send us a design problem where one run costs hours or a prototype. We'll tell you whether a world model can cut it down." Primary blue button **Request a pilot**; secondary text link `team@[PLACEHOLDER].com`.

### 6.12 Footer
- Top: huge `OpenWM` wordmark in Instrument Serif, spanning near full width (like a masthead), cropped slightly at the bottom edge.
- Below: 4-column dense link grid (Company / Research / Contact / Social) in Inter 14px, mono column headers.
- Bottom bar (mono 11px): `© 2026 OpenWM` · **live clock** showing Seoul time `SEOUL 11:46 KST` updating every minute (f.inc nod) · `Built with verification.`
- Optional: a faint line-art illustration (wireframe airfoil / heat-sink fin array) as a footer anchor, World Labs style — draw it as SVG, don't use stock.

---

## 7. Signature interaction — the Confidence Gate (hero)

This is what makes the site memorable. It must clearly *demonstrate the product idea*, not just look cool.

**What it shows:** A 2D (or light 3D) **airfoil cross-section** in thin `--paper` line-art, with streamlines flowing around it. A small HUD in mono shows `predicted L/D`, `confidence`, and `route`.

**Behavior:**
1. Every ~3s the shape **morphs** to a new design variant (vary camber/thickness smoothly via a parametric NACA-style function).
2. For each variant, compute a fake but smooth "confidence" value (e.g. based on distance from a set of "training" designs in parameter space).
3. **High confidence (≥ threshold):** streamlines are calm `--paper-dim`, readout says `route: PREDICT`, number resolves instantly.
4. **Low confidence (< threshold):** the regions of the flow field where uncertainty is high **bloom in blue** (soft blue glow, additive), the readout flips to `route: VERIFY → real test`, a small "running" tick animates for ~1s, then the shape is added to the "training set" (shown as a small dot in a mini parameter-space plot in the corner) and confidence for nearby shapes rises. *This is the whole product in one loop.*
5. A small **threshold slider** (mono label `confidence threshold 0.85`) under the frame lets visitors raise/lower it and watch how many designs get routed to real tests — show a running counter: `real tests run: 3 / 24 designs`.
6. Hover/drag on desktop: the cursor nudges the shape parameters slightly. Touch: tap to advance to the next design.

**Implementation:** Canvas 2D or Three.js/react-three-fiber — pick canvas 2D unless 3D clearly adds meaning. Keep it < 60 KB of JS for this component, 60 fps on a mid laptop, pause when off-screen (IntersectionObserver), and honor `prefers-reduced-motion` by rendering a single static frame showing one PREDICT and one VERIFY state side by side. Lazy-load it so the headline paints first.

All numbers in the visualization are illustrative; add a tiny mono footnote: `Illustrative simulation.`

---

## 8. Motion

- Default reveal: elements fade up 12px over `--dur-3` with `--ease-out`, staggered 60ms, triggered once on enter. No bounce, no parallax overload.
- Headlines: split by line (not character), each line rises from an overflow-hidden mask.
- Hairline section rules draw left→right (scaleX 0→1) on enter.
- Links: underline grows from left on hover; arrows `→` translate 4px.
- Buttons: blue button darkens slightly on hover; no scale transforms.
- Respect `prefers-reduced-motion`: disable all of the above except opacity.
- Use CSS + IntersectionObserver or Framer Motion; don't pull in GSAP unless needed for the hero.

---

## 9. Other pages

Keep them in the same system; they can be lighter.

- **`/research`** — list of posts from `content/posts`, World Labs-style: mono date, serif title, dek, tag chips. Each post page: journal layout (label column + 62ch text column), figures in `<Frame>` with `FIG. N` captions, footnotes, KaTeX support for equations.
- **`/about`** — thesis paragraph, team grid (**[PLACEHOLDER]** names/roles/photos; monochrome photos, mono role labels), "What we believe" list (verification as culture; honesty about uncertainty; small teams deserve great tools).
- **`/careers`** — one paragraph + "No open roles listed — write to us anyway." with email.
- **`/pilot`** (Request a pilot) — a short form: name, email, company, what you're designing (select: Drones/Aero, Thermal, Other), what one test currently costs (select: hours / days / a prototype), message. Client-side validation; submit to a placeholder handler (`/api/pilot` stub or Formspree **[PLACEHOLDER]**). Success state in Instrument Serif: "Thanks — we'll be in touch."
- **404** — Instrument Serif "This page is outside the training distribution." with `route: VERIFY → home` link. (One joke allowed on the whole site; this is it.)

---

## 10. Tech stack & structure

- **Next.js (App Router) + TypeScript + Tailwind CSS**, static export (`output: 'export'`) so it deploys to Vercel or GitHub Pages.
- Map the CSS tokens in §3 into `tailwind.config` (`colors.ink`, `colors.paper`, `colors.blue`, `fontFamily.display/body/mono`).
- Fonts via `next/font/google`: `Instrument_Serif` (weights `400`, styles `normal` + `italic`), `Inter`, `JetBrains_Mono`. `display: swap`.
- MDX for posts (`@next/mdx` or `contentlayer`-style local loader), KaTeX for math.
- Suggested structure:

```
app/
  layout.tsx            # fonts, nav, footer, metadata
  page.tsx              # home sections
  research/page.tsx
  research/[slug]/page.tsx
  about/page.tsx
  careers/page.tsx
  pilot/page.tsx
  not-found.tsx
components/
  Nav.tsx  Footer.tsx  Frame.tsx  SectionLabel.tsx
  Button.tsx  TagChip.tsx  PostCard.tsx  Reveal.tsx
  SeoulClock.tsx
  hero/ConfidenceGate.tsx   # §7
  diagrams/Pipeline.tsx  diagrams/StepIcons.tsx
content/posts/surrogate-hacking-airfoil.mdx
lib/config.ts           # SHOW_METRICS flag, contact email, socials
public/og.png           # generated OG image: black, wordmark, one blue line
```

- SEO: per-page `metadata`, OG image (black, Instrument Serif wordmark, single blue uncertainty band), `sitemap.xml`, `robots.txt`.
- Title pattern: `OpenWM — World models for physical intelligence`.

---

## 11. Quality bar

- **Performance:** Lighthouse ≥ 95 on Performance, Accessibility, Best Practices, SEO (desktop). LCP < 2.0s. Hero headline must paint before the canvas loads.
- **Accessibility:** WCAG AA contrast (check `--paper-dim` on `--ink` and blue button text). Visible focus rings (2px blue outline, 2px offset). Full keyboard nav incl. mobile menu and slider. Canvas has `role="img"` + descriptive `aria-label`, and the slider is a real `<input type="range">`.
- **Responsive:** test at 360, 768, 1024, 1440, 1920. On mobile the hero stacks (headline → canvas → CTAs), the 12-col journal layout collapses to single column with the mono label above content, and display type never causes horizontal scroll.

---

## 12. Do not

- Don't copy World Labs' or Founders Inc.'s logos, images, illustrations, or copy. Borrow structure and feel only.
- Don't use generic "AI startup" tells: purple-to-blue gradients, glassmorphism, glowing orbs, 3D blobs, emoji in headings, "Revolutionize/Unlock/Supercharge," icon-in-a-rounded-square feature grids, fake testimonials, fake customer logo walls.
- Don't use rounded-full buttons or cards with large radii.
- Don't use blue decoratively. Blue = uncertainty or action. Nothing else.
- Don't bold Instrument Serif. Don't set body text in it.
- Don't invent metrics, partners, investors, or team members. Use visible `[PLACEHOLDER]` stubs.

---

## 13. Acceptance checklist (verify each before you say you're done)

- [ ] Fonts: Instrument Serif (incl. italic) on all display text; Inter body; mono labels.
- [ ] Palette limited to ink / paper / blue (+ defined tints). Blue used only for uncertainty and primary actions.
- [ ] All home sections §6.1–6.12 present, in order, with real copy.
- [ ] Confidence Gate: morphs, flips PREDICT/VERIFY, blue blooms on low confidence, threshold slider changes routing and the counter, reduced-motion fallback works, pauses off-screen.
- [ ] Metrics section hidden by default via `SHOW_METRICS=false`.
- [ ] Seoul live clock in footer.
- [ ] Research index + the airfoil paper post render from MDX.
- [ ] /about, /careers, /pilot (form validates), custom 404.
- [ ] Lighthouse ≥ 95 across the board; no layout shift from fonts.
- [ ] Keyboard-only walkthrough works; focus visible everywhere.
- [ ] No horizontal scroll at 360px.
- [ ] `grep -r "PLACEHOLDER"` output listed in your final summary so I know what to fill in.

When finished, reply with: (1) how to run it locally, (2) the list of judgment calls you made, (3) the placeholder list.
