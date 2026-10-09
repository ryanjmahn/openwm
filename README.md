# OpenWM — website

Next.js (App Router) + TypeScript + Tailwind v4, exported as a static site.

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # static export → ./out
npx serve out      # preview the export
```

- Design tokens: `app/globals.css` (`:root` + Tailwind `@theme`).
- Fonts: Instrument Serif (display), Departure Mono (labels/UI, self-hosted in `app/fonts`, OFL), Inter (body).
- Visual system: light palette + Bayer-dithered noise "clouds" (`components/sims/DitherField.tsx`) + pixel particles.
- Hero: blueprint → 3D model → simulation loop (`components/sims/BlueprintModel.tsx`, geometry in `blueprint.ts`).
- "How it works" tabs: airflow confidence gate (`components/hero/`), uncertainty gate demo, live heat-sink solver (`components/sims/`).
- All canvases share `useCanvasSim` (DPR, pause off-screen, reduced-motion still frame).
- Posts: add `content/posts/<slug>.mdx` exporting `meta` (title, date, dek, tags). Math via `$…$` / `$$…$$`. Add `draft: true` to keep a post unpublished (the airfoil paper is a draft for now).
- Metrics section is hidden unless `NEXT_PUBLIC_SHOW_METRICS=true` (`lib/config.ts`).
- Contact email, socials, domain, and pilot form endpoint live in `lib/config.ts`.
