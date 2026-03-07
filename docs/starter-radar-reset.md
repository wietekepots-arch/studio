# Starter Radar Reset

Status: actief
Datum: 2026-03-07

## Doel

Deze handleiding beschrijft hoe je de starterdata van de radar veilig vervangt
zonder echte gebruikersdata per ongeluk te verwijderen.

Gebruik deze reset als:

- de seed-structuur is veranderd
- de starterblips opnieuw moeten worden opgebouwd
- oude legacy-seeddata nog in Firestore staat

Gebruik deze reset niet als:

- je handmatig ingevoerde blips wilt opschonen
- je ervaringen wilt verwijderen
- je alle Firestore-data leeg wilt maken

## Hoe werkt het nu

De app ondersteunt een veilige reset-and-reseed flow.

Deze flow:

1. verwijdert bekende legacy starterdocs
2. verwijdert docs met `seedManaged: true`
3. verwijdert bijbehorende `itemHistory` subcollecties van seed-items
4. schrijft daarna de actuele starterset opnieuw weg

De reset is beschikbaar via het dashboard voor reviewers/admins.

## Wat wordt verwijderd

De reset kijkt naar seed-managed records in deze collecties:

- `quadrants`
- `rings`
- `radarProviders`
- `radarFamilies`
- `tags`
- `radarItems`
- `radarItems/{id}/itemHistory`

Daarnaast worden bekende legacy starter-id's expliciet meegenomen, zodat oude
starterblips niet blijven hangen na een reseed.

## Wat blijft staan

De reset verwijdert niet:

- handmatig aangemaakte blips zonder `seedManaged: true`
- `experiences`
- gebruikersprofielen
- andere operationele appdata

Kort gezegd: deze reset is bedoeld voor startercontent, niet voor echte
gebruikerscontent.

## Aanbevolen werkwijze

1. Open het dashboard als reviewer/admin.
2. Gebruik `Starter radar resetten`.
3. Bevestig de melding.
4. Controleer daarna of de nieuwe starterblips zichtbaar zijn.

Je hoeft de huidige starterrecords dus normaal niet handmatig uit Firestore te
verwijderen.

## Volgende stappen

Gebruik na deze wijziging bij voorkeur deze volgorde:

1. Doe eerst een pre-reset check op bestaande `experiences`.
2. Voer daarna pas de starter reset uit.
3. Controleer daarna de nieuwe provider-first starterset in de UI en in
   Firestore.
4. Werk vervolgens de resterende onderdelen van de provider-first spec af.

### Pre-reset check

Controleer of er bestaande `experiences` zijn die nog verwijzen naar oude
model-blips of legacy seed-id's.

Belangrijk:

- de reset verwijdert oude starterblips
- de reset verwijdert geen `experiences`
- daardoor kunnen oude experience-links na de reset "los" komen te hangen

Beslisregel:

- Alleen testdata of geen experiences: reset kan direct.
- Echte experiences aanwezig: eerst migreren, daarna resetten.

### Reset

Als de pre-reset check groen is:

1. Open het dashboard als reviewer/admin.
2. Klik op `Starter radar resetten`.
3. Bevestig de melding.

### Post-reset verificatie

Controleer daarna minimaal dit:

- de oude model-per-blip seed-items zijn verdwenen
- de nieuwe providerblips staan in Firestore
- de detailpagina's laden zonder ontbrekende referenties
- de seedcontent is zichtbaar in het Nederlands
- er zijn geen experiences die verwijzen naar verwijderde starterblips

### Daarna: provider-first spec afronden

De reset is niet het einde van het werk, maar het moment waarop de nieuwe
starterset schoon actief staat. Daarna volgen de resterende spec-onderdelen.

Belangrijkste open punten:

- experience-migratie naar providerblip plus optionele modelcontext
- verdere aanscherping van governance- en certificeringscopy
- `AI Prefill` volgens de spec
- `costRange` verder terugdringen uit de hoofdflow van het formulier

## Wanneer handmatig ingrijpen nodig is

Handmatig opschonen is alleen nodig als:

- oude docs buiten de bekende legacy-id's vallen
- records foutief zonder `seedManaged: true` zijn aangemaakt
- iemand seeddata handmatig heeft aangepast op een manier die niet meer onder
  de resetregels valt

Als dat gebeurt, verwijder dan gericht alleen de afwijkende records en niet de
hele collectie.

## Relevante implementatie

- Resetlogica: [src/lib/radar-firestore.ts](/Users/wietekepots/Web/studio/src/lib/radar-firestore.ts)
- Dashboardactie: [src/app/dashboard/page.tsx](/Users/wietekepots/Web/studio/src/app/dashboard/page.tsx)
- Starterseed: [src/lib/radar-seed.ts](/Users/wietekepots/Web/studio/src/lib/radar-seed.ts)
- Productspec: [docs/provider-first-blip-spec.md](/Users/wietekepots/Web/studio/docs/provider-first-blip-spec.md)
