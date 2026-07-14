# Dev-workflow — co-vibe-coding op de Agency Radar

Hoe het team (developers én niet-developers) samen aan deze app bouwt met
Claude Code, GitHub en het Notion-board. Niet-developers starten bij
[ONBOARDING.md](../ONBOARDING.md); dit document is de procesreferentie voor
developers.

## Rollen

| Rol | GitHub-rol | Mag |
| --- | --- | --- |
| Niet-developer (vibe-coder) | Write | branches pushen, PR's openen — niet mergen |
| Developer | Maintain | alles hierboven + reviewen en mergen |
| Repo-owner | Admin | alles + settings; kan vangrails bypassen (spaarzaam gebruiken) |

## Flow

1. Werk staat als kaartje op het Notion-board
   [Tech Radar](https://www.notion.so/greenberry/Tech-Radar-2a77078e5514815a921ddefb47852685)
   (kolom **Ready**) of als GitHub-issue met label `ready-for-ai`.
2. Implementatie op een eigen branch: `feature/<slug>`, `fix/<slug>` of
   `chore/<slug>`; niet-devs gebruiken `vibe/<naam>/<slug>`.
3. PR openen met het template: samenvatting, wat er veranderde, screenshots
   bij UI-werk.
4. CI (`verify`: lint, build, typecheck) moet groen zijn. Er is nog geen test
   runner — zie `docs/todo/`.
5. Een developer reviewt en merget. Kaartje naar **Review** → **Done**.

## Technische vangrails

Deze regels zijn afgedwongen, geen afspraken:

- **Rulesets op `main`**: PR verplicht, 1 approval, code-owner-review,
  groene `verify`-check, geen force pushes. Een tweede ruleset beperkt
  updates van `main` (en dus mergen) tot Maintain en Admin.
- **[CODEOWNERS](../.github/CODEOWNERS)**: de rode zone (Firebase, AI-flows,
  CI, dependencies, synced workflow-assets) vereist review van een code
  owner.
- **[.claude/settings.json](../.claude/settings.json)**: Claude Code mag in
  dit project nooit deployen, force-pushen, PR's mergen of `.env` lezen —
  op geen enkele laptop.
- **Guardrails uit [CONVENTIONS.md](../CONVENTIONS.md)**: geen Firestore
  seed/reset/migraties zonder expliciete afspraak; de app praat lokaal met de
  échte gedeelde database zolang de emulator-default er niet is
  (`docs/todo/emulator-default.md`).

## AI-PR's reviewen

Waar je bij een PR van een niet-dev (of eigen vibe-sessie) extra op let:

- **Scope**: één taak per PR; onverwachte bestanden erin = terugsturen.
- **Rode zone-diffs**: wijzigingen in Firebase, AI-flows, dependencies of CI
  die niet bij de taak horen — CODEOWNERS vangt dit, jij beoordeelt het.
- **Gedrag boven checks**: CI dekt geen runtime-gedrag; vraag om screenshots
  of klik de flow zelf even door.
- **Feedback via de PR**: de niet-dev haalt jouw opmerkingen met Claude op en
  verwerkt ze; dat mag je gewoon in reviewtaal opschrijven.

## Issues en labels

Issue-templates staan in `.github/ISSUE_TEMPLATE/`. Labels:
`needs-triage`, `ready-for-ai`, `ai-working`, `needs-review`,
`needs-changes`, `approved`, `bug`, `feature`, `blocked`.

Goede issues zijn klein, concreet, met screenshots en verwacht gedrag.
"Fix app pls" gaat terug naar de indiener.

## Verwante documenten

- [ONBOARDING.md](../ONBOARDING.md) — startgids voor niet-developers
- [CONVENTIONS.md](../CONVENTIONS.md) — projectconventies en guardrails
- [AI-WORKFLOWS.md](../AI-WORKFLOWS.md) — hoe de synced AI-assets samenhangen
- [docs/todo/](./todo/) — openstaand werk aan de vangrails zelf
