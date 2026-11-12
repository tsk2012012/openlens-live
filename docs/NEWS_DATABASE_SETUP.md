# OpenLens: nieuwsarchief en database (stap 1)

## Huidige status
Op 12 november 2026 is Neon PostgreSQL succesvol gekoppeld en is de eerste archief-import voltooid. **606 unieke nieuwsartikelen, 151 uitgevers en 608 artikel-onderwerpkoppelingen** werden opgeslagen uit een eenmalige sample van Nederland, Europa en Wereld. Live nieuws blijft werken zonder database; actuele opslagcijfers zijn op `/api/storage-status` te zien.

## Wat is gebouwd?
- PostgreSQL-tabellen: `ol_publishers`, `ol_articles`, `ol_article_topics`, `ol_ingest_runs`.
- De import bewaart unieke URL's, bronherkomst, uitgever, taal, verschillende datumtypen, geografische queryregio en zoekonderwerp. Niet de volledige betaalde artikeltekst.
- `GET /api/storage-status`: publieke operationele teller. `not_connected` betekent dat er geen databasevariabele is.
- `GET /api/stored-news?topic=netherlands&period=7`: alleen-lezen archiefquery.
- `GET /api/ingest`: beveiligde import, uitsluitend met `Authorization: Bearer <CRON_SECRET>`.
- Eén Vercel Cron Job per dag om **04:17 UTC**. Het importproces controleert 6 zoekonderwerpen per run, verdeeld over NL, EU en Wereld. Het wisselt dagelijks subonderwerpen af. Op alle plannen is eenmaal daags de veiligste standaard.
- Onderzoeksdekking en politieke oriëntatie blijven twee aparte eigenschappen; er worden geen politieke beoordelingen uit headlines afgeleid.

## Eenmalig verbinden (reeds uitgevoerd; alleen relevant bij een nieuwe installatie)
1. Open het project `openlens-live` in Vercel en kies **Storage / Marketplace → Neon (PostgreSQL)**. Maak of verbind een PostgreSQL-database aan dit project. Controleer eventuele kosten en limieten vóór bevestiging.
2. Zorg dat de omgeving `Production` een `DATABASE_URL` heeft die naar deze database verwijst. Via de Vercel-Neon-integratie kan dit automatisch gebeuren. Plak het wachtwoord of de URL **niet in GitHub, een issue of de chat**.
3. Maak in **Vercel → Project → Settings → Environment Variables** een lange willekeurige `CRON_SECRET` aan (bijvoorbeeld 64 hexadecimale tekens). Gebruik alleen een veilige lokale generator en bewaar het geheim uitsluitend als Vercel-environmentvariable.
4. Redeploy `main`, zodat de variabelen beschikbaar zijn in productie.
5. Check `https://openlens-live.vercel.app/api/storage-status`. Voor de eerste import geeft dit `waiting_for_first_ingest` of tijdelijk `unavailable` als de tabellen nog niet bestaan.
6. Laat de ingest-cron automatisch draaien of test die zelf met een geautoriseerde GET op `/api/ingest`. Het endpoint is publiek **niet** zonder geheim uit te voeren.
7. Controleer opnieuw `/api/storage-status`: `collecting` en een niet-nul artikel- en uitgeverstotaal na een geslaagde ingest.

## Bekende grenzen
- De opslag bestaat uit URL's, koppen en metadata uit een **onvolledige steekproef**. De oorspronkelijke publicatiedatum kan afwijken van de indexeringstijd.
- De importtaak gebruikt Google News RSS, waar beschikbare originele RSS-feeds en GDELT. Een geregistreerde uitgever in de Publisher Catalog is nog niet per definitie een aangesloten of recent onderzochte uitgever.
- De app bewaart nog geen volledige artikelen, semantische gebeurtenisclusters, geautomatiseerde politieke beoordelingen of gelicentieerde paywall-inhoud.
- Een database vraagt onderhoud, monitoring, back-ups, toegangsbeheer en aandacht voor nieuwsrechten.
- De oude GitHub Actions-workflow die `publisher-observations.json` bijwerkt, is een **afzonderlijke legacy steekproef**, niet de nieuwe PostgreSQL-database. Verwar deze datasets niet.
- Als `DATABASE_URL` ontbreekt blijft de site werken met de bestaande live API, zonder ten onrechte een gevuld archief te claimen.

## Lokaal testen
```bash
npm install
npm run check
npm run dev
```
De PostgreSQL-verbinding en eerste import zijn op 12 november 2026 via de productieomgeving bevestigd. Unit-tests en periodieke importstatus zijn afzonderlijke controles.
