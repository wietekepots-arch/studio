# Vercel preview links

Status: workflow defined; automation still depends on Vercel project wiring.

## Policy

- Every feature, issue, and bugfix branch should produce a preview deployment before review.
- The preview URL belongs in the pull request description.
- UI changes require the author to verify the preview before requesting review.
- Non-UI changes can skip preview verification only when the pull request states why.

## Branching

- Use scoped branch names such as `feature/<ticket-or-summary>`, `fix/<ticket-or-summary>`, or `chore/<summary>`.
- Vercel should deploy pull request branches automatically once the Git provider integration is connected.

## Follow-Up

- Connect the production Vercel project to this GitHub repository.
- Add preview URL posting to the pull request template or create-pr workflow once the deployment integration is live.
