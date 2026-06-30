# Copilot Instructions

Copilot reliably auto-loads this file, so important coding rules are inlined here instead of referenced indirectly.

## Project Conventions

<!-- BEGIN CONVENTIONS -->
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
<!-- END CONVENTIONS -->

## Core Rules

<!-- BEGIN SHARED:core-rules -->
Apply these as the default coding baseline when project-local conventions do not say otherwise.

## TypeScript And React

- Use TypeScript with strict, explicit types.
- Treat API payloads, `JSON.parse` results, env vars, database rows, files, queue messages, and third-party library data as untrusted until validated.
- Prefer `unknown` plus narrowing or validation at boundaries over `any` or asserted certainty.
- Avoid broad `as` assertions; prefer guards, validation, or better typing.
- Prefer discriminated unions over loose optional-state objects.
- Convert transport shapes into explicit trusted domain types after validation.
- Prefer `interface` for object contracts and `type` for unions/composition.
- Use named function declarations for exported functions and components.
- Use `const handleToggle = () => {}`-style arrow expressions for local callbacks and event handlers inside components.
- Do not use `React.FC`.
- Keep components focused; extract hooks or helpers when logic starts to sprawl.
- Define explicit props types/interfaces for components.
- Prefer composition over deep prop drilling.
- In Next.js projects, default to Server Components and only use `"use client"` for hooks, events, browser APIs, or client-only libraries.
- In Next.js projects, prefer server-side data loading over `useEffect` fetching when a server-rendered path exists.

## Architecture

- Keep presentation thin: rendering and UI state belong in components, not business rules.
- Dependencies flow inward: Presentation -> Application -> Infrastructure -> Domain.
- Presentation can use application-layer APIs and domain types, but not infrastructure directly.
- Domain code stays framework-free and side-effect free.
- Validate and map API, CMS, database, file, and other transport payloads at the boundary before they leak into the UI or domain.

## Avoid

- `any`, unchecked parsing, broad assertions, and anonymous exported APIs.
- Passing raw external payloads straight into domain or UI code.
- Direct fetch, database, or CMS calls inside UI components.
- Components that mix rendering, business logic, and data access.
- Introducing a new styling or component-library pattern that conflicts with project conventions.
- Ignoring `CONVENTIONS.md` or other project-local rules when they exist.
<!-- END SHARED:core-rules -->

## Precedence

1. Project conventions above (from CONVENTIONS.md)
2. Core baseline rules above (from ai-workflows)
3. Other synced workflow files in this project

When project conventions conflict with the core baseline, project conventions win.

## Shared Workflow Source

When a change touches shared workflow assets in a reusable way, suggest
upstreaming it to the [ai-workflows](https://gitlab.com/greenberrynl/config/ai-workflows) repo rather than keeping it only in this
synced target repo.

Treat these as shared workflow assets:

<!-- BEGIN SHARED:workflow-assets -->
- `AI-WORKFLOWS.md`
- `commands/**`
- `rules/**`
- `.github/prompts/**`
- `AGENTS.md`
- `CLAUDE.md`
- `.github/copilot-instructions.md`
- `.cursor/rules/**`
<!-- END SHARED:workflow-assets -->

## Command Mapping

When user intent matches one of these prompts, read and follow the corresponding prompt or runbook:

<!-- BEGIN SHARED:command-mappings -->
- `create pr`, `open pr`, `submit pr` -> `commands/create-pr.md`
- `commit message`, `write commit`, `git commit` -> `commands/commit-message.md`
- `close sprint`, `sluit sprint af`, `sprint afsluiten` -> `commands/close-sprint.md`
- `sprint demo`, `demo voorbereiden`, `demo script`, `prepare demo` -> `commands/sprint-demo.md`
- `sprint planning`, `plan sprint`, `sprint start`, `start sprint`, `plan komende sprint` -> `commands/sprint-planning.md`
<!-- END SHARED:command-mappings -->

Do not assume command files auto-run. Select and execute them when intent matches.

## Safety

<!-- BEGIN SHARED:safety -->
- Prefer concrete execution over long planning.
- Do not modify code unless requested.
- Ask before destructive actions (force kill, reset, delete) unless explicitly requested.
- Always summarize what was run and what changed.
<!-- END SHARED:safety -->
