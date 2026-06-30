# Database guardrail

Status: implemented as project workflow guidance in `CONVENTIONS.md`.

## Policy

- Database changes are not allowed by default.
- Firestore seed, reset, migration, or destructive data-update flows require explicit approval in the current task.
- Validation should prefer local fixtures, mocks, or the Firebase emulator when shared data could otherwise be touched.
- Intentional shared-database work must state the target environment, command, expected writes, rollback path, and approval before execution.

## Follow-Up

- Add emulator-backed tests when the app gets a test runner.
- Keep destructive commands out of default quality checks.
