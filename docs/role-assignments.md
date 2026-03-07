# Role Assignments

## Doel

`roleAssignments` is de duurzame bron voor gebruikersrollen.

`userProfiles` blijft nodig voor profielinformatie zoals naam en team, maar is
niet langer de enige bron voor autorisatie. Daardoor valt een gebruiker niet
meer automatisch terug naar `Member` als een profiel opnieuw wordt aangemaakt.

## Hoe het werkt

- `userProfiles/{uid}` bevat profieldata voor de app.
- `roleAssignments/{uid}` bevat de vaste rol voor die gebruiker.
- Als een profiel ontbreekt, maakt de app het opnieuw aan met de rol uit
  `roleAssignments`.
- Als er nog geen `roleAssignments` document is, valt de app terug op de oude
  `userProfiles.role`.

## Beheer

- Admins beheren rollen via `/admin`.
- De rolentabel schrijft naar `roleAssignments`.
- Als er al een profiel bestaat, wordt `userProfiles.role` ook bijgewerkt zodat
  bestaande data leesbaar blijft.

## Migratiegedrag

- Bestaande `Admin` en `PowerUser` profielen zonder `roleAssignments` worden
  automatisch gemigreerd zodra die gebruiker inlogt.
- Gewone `Member` profielen hoeven niet vooraf gemigreerd te worden.

## Praktische regel

Pas rollen niet meer alleen handmatig aan in `userProfiles`.

Gebruik voortaan:

- de adminpagina voor normale rolwijzigingen
- Firestore-console alleen als noodmaatregel of bootstrap voor de eerste admin
