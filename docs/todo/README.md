# TODO

## Database guardrail

- Add contributor-facing guidance that database changes are not allowed by default.
- Require explicit approval before running Firestore seed, reset, migration, or destructive data-update flows.
- Prefer local mocks, fixtures, or the Firebase emulator when validating app behavior that would otherwise touch shared data.
- Document the approved path for intentional database work so contributors do not improvise direct production changes.

## Vercel preview links

- Add a workflow that creates a Vercel preview link for every feature, issue, and bugfix branch.
- Make the preview URL easy to find from the related ticket or pull request so review does not depend on local setup.
- Define the expected branch naming or deployment trigger rules so previews are created consistently.
- Document when a preview is required and who is responsible for verifying it before merge.

## Notion Kanban connection

- Add an integration path between this project workflow and the Notion Kanban board.
- Define how features, issues, and bugs map to Notion cards and statuses so work stays in sync.
- Decide whether updates should be manual, automated through API/webhooks, or both.
- Document who owns the board sync and what fields must stay current during development and review.
