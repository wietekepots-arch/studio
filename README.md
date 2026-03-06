# Greenberry Agency Radar

An internal AI tool governance platform for Greenberry. Teams track, evaluate, and govern AI tools using an interactive radar — helping the agency make intentional, ethical decisions about what to adopt, trial, assess, or hold.

## What it does

The radar organises AI tools into four quadrants and four adoption rings:

**Quadrants**
- **Creation & Craft** — generative and coding tools that affect creative output
- **Strategy & Intelligence** — LLMs and research tools used for thinking and planning
- **Process & Flow** — productivity, workflow automation, and developer tooling
- **Positive Impact** — tools evaluated for sustainability, privacy, or EU-alignment

**Rings**
- **Adopt** — recommended for active use across the agency
- **Trial** — in active evaluation; teams should form an opinion
- **Assess** — worth watching; not yet ready for broad use
- **Hold** — deprioritised or superseded; avoid new adoption

Each tool entry ("Pulse") carries metadata including team ownership, maturity/impact/risk scores, pricing tiers, sustainability notes, security posture, ethics notes, and a full change history.

## Key features

- Interactive radar visualisation with quadrant and search filtering
- Per-item detail pages with scoring, pricing, and governance metadata
- Role-based access: Admin, Editor, Viewer
- AI-assisted item categorisation (quadrant + tag suggestions via Genkit/Gemini)
- AI short-description drafting
- Threaded comments and activity feed per item
- Experience reports — teams can share how they used a tool, outcomes, and prompts
- Admin governance workflow: propose → review → approve/reject
- Dynamic radar configuration (quadrant and ring names)

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS 4 (`@theme` tokens, no config file) |
| Auth & DB | Firebase (Auth + Firestore) |
| AI flows | Google Genkit + Gemini |
| UI primitives | Radix UI (select, dialog, collapsible) |

## Getting started

```bash
npm install
npm run dev
```

The app runs on [http://localhost:9002](http://localhost:9002) (configured in `package.json`).

To run AI flows in development:

```bash
npm run genkit:dev
```

## Project structure

```
src/
├── app/
│   ├── lib/radar-types.ts   # Core domain types (RadarItem, Experience, etc.)
│   ├── items/               # Item detail and creation routes
│   └── page.tsx             # Home — radar + latest pulses
├── components/
│   ├── layout/              # Navbar, shell
│   ├── radar/               # RadarChart visualisation
│   └── ui/                  # Base UI primitives
├── ai/
│   └── flows/               # Genkit AI flows (categorisation, description)
├── firebase/                # Firebase config and error handling
└── lib/                     # Shared utilities
```

## Radar configuration

Default quadrants and rings are defined in `src/app/lib/radar-types.ts` (`DEFAULT_CONFIG`). Admins can customise these at runtime via the admin interface.

## Roles

| Role | Permissions |
|---|---|
| Viewer | Read-only access to the radar |
| Editor | Create and edit own draft items, submit for review |
| Admin | Approve/reject items, move between rings, manage config |
