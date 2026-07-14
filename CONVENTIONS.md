# CONVENTIONS.md

## Project

Greenberry Agency Radar is an internal AI tool governance platform. Teams use it to track, evaluate, and govern AI tools through an interactive radar, item detail pages, role-based workflows, and experience reports.

## Stack

- Next.js 15 App Router
- React 19
- TypeScript
- Tailwind CSS
- Firebase Auth and Firestore
- Google Genkit with Gemini for AI-assisted flows
- Radix UI primitives and local UI components

## Scripts

- `npm run dev`: start the app on port 9002
- `npm run genkit:dev`: start Genkit development flows
- `npm run genkit:watch`: start Genkit with watch mode
- `npm run lint`: run ESLint
- `npm run build`: create a production build
- `npm run typecheck`: run TypeScript checks

## Structure

- `src/app/`: Next.js routes and app-level pages
- `src/components/`: UI, layout, admin, experience, and radar components
- `src/ai/flows/`: Genkit AI flows
- `src/firebase/`: Firebase setup, providers, and Firestore hooks
- `src/lib/`: shared application utilities and Firestore helpers
- `src/content/`: JSON-backed copy and seed content
- `rules/`, `commands/`, `AI-WORKFLOWS.md`, `AGENTS.md`, `CLAUDE.md`: synced AI workflow assets

## Local Workflow

Use the central ai-workflows repo as the source for shared workflow assets:

```bash
/Users/wietekepots/Web/ai-workflows/scripts/sync.sh --project .
```

Project-specific decisions belong in this file. Shared rules, commands, adapters, and workflow guidance should be changed upstream in `https://gitlab.com/greenberrynl/config/ai-workflows` and synced back.

## Guardrails

- Do not push directly to `main`.
- Keep feature work scoped and finish through pull requests.
- Do not run Firestore seed, reset, migration, or destructive data-update flows without explicit approval.
- Prefer local fixtures, mocks, or Firebase emulator validation when shared data could be touched.
- Run `npm run lint`, `npm run build`, and `npm run typecheck` before handing back implementation work when feasible.
