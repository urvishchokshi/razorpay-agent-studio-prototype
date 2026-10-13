# Razorpay Agent Studio prototype

[Live prototype on Vercel](https://razorpay-agent-studio-prototype.vercel.app)

A complete browser-local prototype built from the supplied Claude Design screens. It preserves the navy header, light navigation, white workspace, compact cards and cyan glass hero. Fonts and component proportions follow Razorpay's open-source Blade system.

## Run locally

Requires Node.js 18 or later. No dependency installation is needed.

```sh
npm run dev
```

Open http://localhost:4173. Set `PORT` to choose another port. `npm run build` checks every JavaScript module and entry asset; `dist/` is the deployable website and needs no compilation.

## Explore

1. Open B2B Customer Agent from Agent Studio.
2. Install it through the five-step demo: connect simulated tools, configure trade tiers, scan sample orders, authorise permissions, and activate.
3. Review introductions, quotes, pricing exceptions, custom work, financing and uncertain buyer labels.
4. Open Activity → Buyers to inspect evidence, order history and conversations.
5. Edit rules in Settings, pause/resume the agent, and inspect the activity log.

Use the compact **Ask Ray** input below the dashboard summary to summarize the current period, understand the pending queue, or prepare standard approvals. Ray presents the proposed actions for your review before applying your selected approvals to the synthetic workspace. Exceptions remain available for individual review.

Other agents have capability previews and synthetic dashboards. Studio includes search, category filters, connectors, notification preferences and a draft workflow builder. The payment pages provide sample records and CSV exports. Global search opens with Command/Ctrl K.

All state stays in browser local storage under `razorpay-agent-studio-v1`. Reset in the header restores the initial synthetic workspace. No payments, messages, calls, external account connections or AI requests are performed. Ray AI gives deterministic responses based on the synthetic workspace.

## Source

- `dist/app.js`: shell, hash routes, state persistence, overlays and workspace pages.
- `dist/studio.js`: catalog, carousel, connectors and draft workflows.
- `dist/onboarding.js`: agent details, previews and installation.
- `dist/dashboard.js`: KPIs, approvals, buyers, activity and settings.
- `dist/ray.js`: dashboard assistant, summaries, queue explanations and reviewed approval proposals.
- `dist/ui.js`: escaping, local SVG icons and reusable controls.
- `dist/*.css`: responsive layouts and reduced-motion support.
- `.openai/hosting.json`: private Sites deployment identity.

Original `.dc.html` exports remain untouched in the parent directory.

## Deploy on Vercel

Import this repository into Vercel. The included `vercel.json` selects the Other framework preset, runs `npm run build` to validate the website, and serves `dist/` as the output directory. Hash-based routes work without server rewrites.

The website has no environment variables or external service dependencies. Walkthrough video assets and local deployment metadata are excluded from deployment uploads.

## Verification

Checked in headless Google Chrome at desktop and 390px mobile widths. Verified installation gates, invalid configuration, timed scan, authorisation, activation, reload persistence, message edits, approval propagation, buyer labels, saved rules, CSV exports, pause guards, command search, keyboard navigation, modal closing, draft persistence, and responsive overflow. No browser errors were observed in those flows.

The site uses ES modules, bundled fonts and inline SVG icons. It makes no runtime requests to external fonts, icon libraries or application APIs. Charts are SVG; transitions use transform and opacity with reduced-motion overrides.
