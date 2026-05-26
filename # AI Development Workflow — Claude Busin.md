# AI Development Workflow — Claude Business + GitHub

Dit document beschrijft hoe we als team samenwerken aan de webapp met behulp van Claude Code, GitHub Issues en Pull Requests.

Doel:

- Iedereen kan bijdragen aan de app
- Ook niet-programmeurs kunnen issues aanmaken
- AI helpt met implementatie
- Kwaliteit blijft bewaakt
- Alleen reviewed code wordt gemerged

---

# 1. Setup door Repo Owner (GitHub)

## 1.1 Branch protection instellen

Ga naar:

```txt
GitHub → Repository → Settings → Branches
```

Bescherm de `main` branch met:

### Vereist

- Require pull request before merging
- Require approvals (1 of meer)
- Dismiss stale approvals
- Require status checks to pass
- Require branches to be up to date
- Restrict direct pushes to main

### Niet toestaan

- Direct push naar main
- Force push
- Auto-merge zonder review

---

# 1.2 Maak issue templates aan

Maak folder:

```txt
.github/ISSUE_TEMPLATE/
```

Voeg toe:

```txt
bug_report.md
feature_request.md
```

---

## bug_report.md

```md
---
name: Bug report
about: Report something that is broken
title: "[Bug]: "
labels: ["bug", "needs-triage"]
---

## What were you trying to do?

## What happened?

## What should have happened?

## Steps to reproduce

1.
2.
3.

## Screenshots or video

## Priority

- [ ] Critical
- [ ] Important
- [ ] Minor

## Extra context
```

---

## feature_request.md

```md
---
name: Feature request
about: Suggest a new feature or improvement
title: "[Feature]: "
labels: ["feature", "needs-triage"]
---

## What problem does this solve?

## What would you like to happen?

## Who benefits from this?

## How should it work?

## Current behavior

## Why is this important?

## Screenshots / inspiration

## Extra context
```

---

# 1.3 Voeg PR template toe

Maak:

```txt
.github/pull_request_template.md
```

Inhoud:

```md
## Summary

## What changed?

## Screenshots (if UI changed)

## Tests performed

- [ ] lint
- [ ] typecheck
- [ ] tests
- [ ] build

## Risks / things to review
```

---

# 1.4 Voeg CLAUDE.md toe

In de root van de repo:

```txt
CLAUDE.md
```

Inhoud:

```md
# Claude Instructions

You are helping contributors work on this web application.

## General Rules

- Never push directly to main
- Never merge pull requests
- Keep changes small and focused
- Prefer minimal changes
- Ask for clarification if the issue is unclear

## Forbidden Areas

Do not modify unless explicitly requested:

- authentication
- payment flows
- deployment configuration
- database migrations
- CI/CD configuration

## Code Quality

Before finishing:

- run npm run lint
- run npm run typecheck
- run npm run test
- run npm run build

## Pull Requests

Every PR should contain:

- short summary
- explanation of changes
- testing notes
- screenshots if UI changed

## Style

- prefer readable code
- avoid unnecessary dependencies
- keep components simple
```

---

# 1.5 Voeg GitHub labels toe

Aanbevolen labels:

```txt
needs-triage
ready-for-ai
ai-working
needs-review
needs-changes
approved
bug
feature
blocked
```

---

# 1.6 Configureer CI checks

Bijvoorbeeld GitHub Actions:

```txt
lint
typecheck
test
build
```

Voorbeeld:

```yaml
npm run lint
npm run typecheck
npm run test
npm run build
```

---

# 2. Setup in Claude Business

## 2.1 Maak gedeeld Claude Project

Maak een project:

```txt
Webapp Development
```

Deel dit met het team.

Gebruik dit project voor:

- product context
- workflows
- coding afspraken
- screenshots
- feature uitleg
- architectuur uitleg

---

## 2.2 Voeg project knowledge toe

Bijvoorbeeld:

### Product

- wat de app doet
- doelgroep
- flows

### Development rules

- kleine PRs
- altijd tests
- geen directe merges

### UI/UX regels

- design system
- component naming
- conventions

---

# 3. Workflow voor teamleden

---

# OPTIE A — Claude Desktop App

## Stap 1

Clone repo:

```bash
git clone <repo>
```

---

## Stap 2

Open repo lokaal.

---

## Stap 3

Start Claude Code:

```bash
claude
```

---

## Stap 4

Vraag Claude:

```txt
Implement GitHub issue #123.

Keep the changes small.
Do not merge.
Run tests before finishing.
Create a pull request summary.
```

---

## Stap 5

Claude:

- analyseert issue
- wijzigt code
- runt tests
- helpt committen

---

## Stap 6

Teamlid:

- pusht branch
- maakt PR
- tagt reviewer

---

# OPTIE B — Claude CLI

Zelfde flow:

```bash
claude
```

of:

```bash
claude "Implement issue #123"
```

---

# OPTIE C — Claude Web Interface

Voor niet-technische gebruikers of lichte hulp.

## Gebruik voor:

- brainstorms
- issue refinement
- copy/UI teksten
- uitleg

Niet ideaal voor:

- direct multi-file coding
- autonomous repo work

---

# 4. Workflow voor niet-programmeurs

## Zij doen alleen:

### 1. Maak GitHub issue

Gebruik template.

### 2. Voeg toe:

- screenshots
- screen recordings
- uitleg

### 3. Klaar

Geen codekennis nodig.

---

# 5. Workflow voor developers / vibecoders

## Stap 1

Pak issue met label:

```txt
ready-for-ai
```

---

## Stap 2

Open Claude Code.

---

## Stap 3

Vraag:

```txt
Implement this issue.
Keep scope minimal.
Do not refactor unrelated code.
Run all checks.
```

---

## Stap 4

Maak PR.

---

## Stap 5

Vraag review aan.

---

# 6. Quality Guardrails

## AI mag NOOIT:

- direct mergen
- deployen
- production secrets wijzigen
- auth/payment herschrijven zonder expliciete scope

---

## Altijd verplicht:

- PR review
- CI checks groen
- menselijke goedkeuring

---

# 7. Aanbevolen Teamregels

## Goede issues:

- klein
- concreet
- screenshots
- duidelijke verwachting

---

## Slechte issues:

- “fix app pls”
- meerdere features tegelijk
- geen reproduceerbare stappen

---

# 8. Ideale Workflow Samenvatting

```txt
Niet-tech collega
→ maakt issue

Lead/reviewer
→ zet label ready-for-ai

Developer + Claude
→ implementeert
→ maakt PR

GitHub checks
→ valideren kwaliteit

Reviewer
→ approve / request changes

Merge
→ alleen na review
```

---

# 9. Beste Praktijken

## Houd AI-taken klein

Beste resultaten:

- kleine bugs
- UI fixes
- component uitbreidingen
- simpele flows

---

## Vermijd grote AI-taken

Niet direct:

- complete refactors
- auth rewrites
- database redesigns
- complexe architectuur

---

# 10. Aanbevolen Tooling

## Beste combinatie momenteel

### Voor developers

- Claude Code
- Cursor
- GitHub Desktop

### Voor niet-tech teamleden

- GitHub Issues
- Screenshots/video’s

### Voor kwaliteit

- GitHub Actions
- Branch protection
- PR reviews
