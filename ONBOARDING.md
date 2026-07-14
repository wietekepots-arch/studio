# Aan de slag met de Agency Radar — voor niet-developers

Welkom! Dit is de startgids voor iedereen die wil meebouwen aan de
[Greenberry Agency Radar](https://github.com/wietekepots-arch/studio) zonder
programmeerervaring. Je gaat "co-vibe-coden": **jij stuurt, Claude bouwt, een
developer keurt**.

Het belangrijkste vooraf: **je kunt niets permanent slopen.** Alles wat je
maakt gaat via een pull request (een voorstel-tot-wijziging) die een developer
eerst bekijkt. Tot die het goedkeurt, is er niets veranderd aan de echte app.

> 💡 Open je dit document in Claude Code? Vraag dan gewoon:
> *"Loop deze onboarding stap voor stap met me door."*
> Claude helpt je dan bij elke stap hieronder.

---

## 1. Eenmalig regelen

Je hebt drie dingen nodig:

1. **GitHub-account** — maak er zelf gratis een aan op
   [github.com/signup](https://github.com/signup) (gebruik je
   Greenberry-mailadres) en vraag Wieteke daarna om een uitnodiging voor de
   repository `wietekepots-arch/studio`. De uitnodiging komt per mail binnen —
   accepteren en klaar.
2. **Claude-account** (Greenberry Business) met toegang tot Claude Code —
   vraag Wieteke of een developer uit het team. Vraag meteen ook toegang tot
   het gedeelde Claude-project
   [Agency Radar — ideeën & refinement](https://claude.ai/project/019e64a6-c9c0-757f-aac3-910c9235c8dd).
3. **Een account in de Radar-app zelf** (rol Viewer of Editor), zodat je kunt
   inloggen als je de app bekijkt — vraag Wieteke of een developer.

## 2. Kies je gereedschap

| | Claude Code in de browser | Claude Code desktop-app |
| --- | --- | --- |
| Installeren | Niets | App downloaden |
| Waar | [claude.ai/code](https://claude.ai/code) | [claude.ai/download](https://claude.ai/download) |
| App live bekijken | Beperkt | Ja, op je eigen computer |
| Aanrader voor | Je eerste taken | Zodra je vaker meedoet |

**Browser (makkelijkste start):** ga naar claude.ai/code, koppel je
GitHub-account als daarom gevraagd wordt, en kies de repository
`wietekepots-arch/studio`. Klaar.

**Desktop-app:** download de app, open Claude Code en vraag letterlijk:
*"Clone de repository wietekepots-arch/studio en open die."* Claude regelt de
rest en vertelt je wat er eventueel nog geïnstalleerd moet worden.

## 3. Kies een taak

- Kijk op het Notion-board
  [Tech Radar](https://www.notion.so/greenberry/Tech-Radar-2a77078e5514815a921ddefb47852685)
  in de kolom **Ready**, of in de
  [GitHub issues](https://github.com/wietekepots-arch/studio/issues).
- Zet je naam op het kaartje en verplaats het naar **In progress**.
- **Begin klein.** Goede eerste taken: een tekst aanpassen, een knop of kleur
  wijzigen, een lijstje anders sorteren, een pagina-onderdeel toevoegen.

**Nog geen concrete taak, wel een idee?** Werk het eerst uit in het gedeelde
Claude-project
[Agency Radar — ideeën & refinement](https://claude.ai/project/019e64a6-c9c0-757f-aac3-910c9235c8dd)
(zie je het project niet na het klikken, vraag dan even om toegang). Spar daar
tot je idee een klein, concreet kaartje is: wat moet er
anders, waar in de app, en hoe ziet "af" eruit. Zet het resultaat op het
Notion-board of maak er een GitHub-issue van (er staat een template klaar).
Vuistregel: **denken doe je in het Project, bouwen in Claude Code.**

## 4. Zo werk je met Claude

Start een nieuwe sessie in het project en beschrijf wat je wil. Voorbeelden:

```txt
Pak GitHub issue #42 op. Maak een nieuwe branch, houd de wijziging
klein, en maak aan het eind een pull request.
```

```txt
Op de loginpagina staat nu "Welkom terug". Verander dat in
"Log in bij de Agency Radar". Laat me het resultaat zien.
```

```txt
Ik wil dat de radar-items in de lijst op naam gesorteerd worden
in plaats van op datum. Leg me daarna uit wat je veranderd hebt,
alsof ik geen developer ben.
```

Tips die het verschil maken:

- **Eén taak per sessie.** Klein en af verslaat groot en half.
- **Beschrijf het gewenste resultaat**, niet de technische oplossing.
- **Plak screenshots** van wat je bedoelt of wat er misgaat — dat werkt beter
  dan een lange omschrijving.
- **Vraag om uitleg** wanneer je iets niet snapt. Daar leer je van, en het
  kost niets.
- Claude kent de projectregels en conventies al (die staan in de repository).
  Jij hoeft ze niet uit je hoofd te leren.

## 5. Spelregels

**Groene zone** — hier mag je vrij bouwen:

- Teksten en copy (`src/content/`)
- Pagina's en UI-componenten: knoppen, lijsten, kleuren, layout
- Documentatie (`docs/`)

**Rode zone** — alleen samen met een developer:

- Inloggen en rechten (auth)
- Database en opgeslagen data (Firebase/Firestore)
- AI-flows (`src/ai/`)
- Pakketten installeren of updaten (`package.json`)
- CI- en deploy-configuratie (`.github/`, `apphosting.yaml`)

Drie harde regels:

1. **Nooit zelf mergen.** Een developer keurt en merget elke pull request.
2. **Nooit database-scripts draaien** (seed, reset, migratie). De app praat
   met de échte, gedeelde database — ook als je lokaal werkt.
3. Stelt Claude iets voor in de rode zone? **Stop en haal een developer
   erbij.** Claude kent deze regels ook, maar jij bent de tweede vangrail.

## 6. Bekijk je werk

- Vraag Claude: *"Start de app zodat ik kan meekijken."* De app draait dan op
  [http://localhost:9002](http://localhost:9002) (desktop-app). Log in met je
  Radar-account.
- Werk je aan AI-functies (categorisatie, beschrijvingen genereren)? Daar is
  eenmalig een sleutel voor nodig (`GEMINI_API_KEY`) — vraag een developer om
  die in te stellen.
- **Maak voor/na-screenshots.** Die gaan straks in je pull request en zijn
  voor de reviewer goud waard.
- Let op: de data die je ziet is de echte gedeelde data. Kijken en testen mag,
  maar geen bulk-wijzigingen of test-rommel achterlaten.

## 7. Inleveren: de pull request

Klaar en tevreden? Vraag Claude:

```txt
Maak een pull request van mijn werk.
```

Claude draait dan eerst de kwaliteitschecks (lint, typecheck, build), zet je
werk online en maakt de pull request aan, met samenvatting. Daarna:

1. Voeg je screenshots toe aan de pull request (of vraag Claude dat te doen).
2. Vraag een developer om review (tag in GitHub of stuur even een berichtje).
3. De automatische checks op GitHub moeten groen zijn.
4. De developer keurt goed (of vraagt aanpassingen — heel normaal, gewoon
   weer aan Claude voorleggen) en merget.
5. Zet het Notion-kaartje op **Review**, en na de merge op **Done**.

## 8. Als het misgaat

- Zolang er niets gemerged is, is er niets stuk. Echt niet.
- Spijt van je wijzigingen? Vraag: *"Zet al mijn wijzigingen terug, ik wil
  opnieuw beginnen."*
- Foutmelding in beeld? Plak 'm gewoon in de chat — Claude lost het meestal
  zelf op.
- Kom je er niet uit: vraag Wieteke of een developer uit het team. Liever een
  vraag te veel dan een middag vastzitten.

## 9. Mini-woordenlijst

| Term | Betekenis |
| --- | --- |
| Repository (repo) | De map met alle code en documenten van het project |
| Branch | Jouw eigen werkkopie naast de hoofdversie |
| Commit | Een opgeslagen tussenstap van je werk |
| Pull request (PR) | Je voorstel om jouw werk in de hoofdversie op te nemen |
| Merge | Het moment waarop je werk écht in de app komt |
| CI / checks | Automatische controles die je werk nakijken |
| Review | Een developer leest je voorstel na en keurt het goed |
| main | De hoofdversie van de app — daar kom je alleen via een PR |

## 10. Checklist: klaar is klaar

- [ ] Eén taak opgepakt en klein gehouden
- [ ] Zelf bekeken in de app, voor/na-screenshots gemaakt
- [ ] Checks groen (Claude draait ze voor je)
- [ ] Pull request gemaakt met samenvatting en screenshots
- [ ] Review aangevraagd bij een developer
- [ ] Notion-kaartje bijgewerkt

Veel plezier — en onthoud: jij stuurt, Claude bouwt, een developer keurt. 🎯
