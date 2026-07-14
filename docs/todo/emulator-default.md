# Emulator-default voor lokale ontwikkeling

Status: open — het beleid bestaat ([database guardrail](./database-guardrail.md)),
maar technisch praat `npm run dev` nog met de echte gedeelde Firestore.
Voor co-vibe-coding met niet-developers moet veilig de standaard zijn, niet
de afspraak.

## Doel

Een niet-dev die lokaal ontwikkelt raakt nooit per ongeluk gedeelde data.

## Aanpak (schets)

- Emulator-config toevoegen aan `firebase.json` (auth + firestore; die
  ontbreekt nu volledig).
- `src/firebase/index.ts`: `connectAuthEmulator`/`connectFirestoreEmulator`
  achter een env-flag (bijv. `NEXT_PUBLIC_FIREBASE_EMULATOR=1`).
- Seed-fixture met een handvol radar-items en een testaccount per rol, zodat
  de lege emulator direct bruikbaar is.
- `npm run dev:safe` dat emulators + seed + dev-server in één keer start, en
  in ONBOARDING.md de standaard wordt.

## Acceptatie

- `npm run dev:safe` werkt zonder `.env`-geheimen en zonder netwerkschrijf
  naar productie-Firestore.
- ONBOARDING.md sectie 6 ("Bekijk je werk") verwijst naar `dev:safe` en de
  waarschuwing over gedeelde data kan daar weg.
- De emulator-route is de basis voor toekomstige e2e-smoke-tests
  (follow-up uit de database guardrail).
