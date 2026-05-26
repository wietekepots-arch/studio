# CLAUDE.md

## Purpose

Use this repository as the canonical source for AI workflows shared across devices and IDE profiles.

## Source Of Truth

- Canonical policy: `AGENTS.md`
- Baseline defaults: `rules/rules.md`
- Runbooks: `commands/*.md`

Read `rules/rules.md` before making project-level decisions.

## Contribution Workflow

- Never push directly to `main`
- Never merge pull requests
- Keep changes small and focused
- Prefer minimal changes over broad refactors
- Ask for clarification if the issue or acceptance criteria are unclear

Use GitHub Issues as the entry point for work. Prefer issues that are already
scoped and ready for implementation. Finish work in a pull request, not on the
protected branch.

## Command Mapping

When user intent matches one of these prompts, read and follow the corresponding runbook:

<!-- BEGIN SHARED:command-mappings -->

- `run checks`, `run-checks`, `quality checks` -> `commands/run-checks.md`
- `review code`, `code review`, `review changes` -> `commands/review-code.md`
- `create pr`, `open pr`, `submit pr` -> `commands/create-pr.md`
- `kill port`, `port 3000`, `eaddrinuse` -> `commands/safe-kill-port.md`
- `commit message`, `write commit`, `git commit` -> `commands/commit-message.md`
- `new component`, `scaffold`, `create component` -> `commands/scaffold-component.md`
- `new device`, `setup device`, `onboarding` -> `commands/new-device-setup.md`
<!-- END SHARED:command-mappings -->

Do not assume command files auto-run. Select and execute them when intent matches.

## Protected Areas

Do not modify these areas unless the user explicitly requests it:

- authentication
- payment flows
- deployment configuration
- database migrations
- CI/CD configuration

## Quality Checks

Before finishing, run the checks that exist in this repository:

- `npm run lint`
- `npm run build`
- `npm run typecheck`

If a `test` script is added later, run it before handing work back.

## Pull Requests

Every pull request should include:

- a short summary
- the concrete changes made
- testing notes
- screenshots when UI changed
- risks or specific review points

## Safety

<!-- BEGIN SHARED:safety -->

- Prefer concrete execution over long planning.
- Do not modify code unless requested.
- Ask before destructive actions (force kill, reset, delete) unless explicitly requested.
- Always summarize what was run and what changed.
<!-- END SHARED:safety -->
