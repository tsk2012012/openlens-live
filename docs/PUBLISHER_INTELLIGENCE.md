# OpenLens — Publisher Intelligence, stap 3

**Datum van de eigendomscontrole:** 12 november 2026.

## Welke gegevens zijn echt, en welke niet?

OpenLens toont drie strikt gescheiden onderdelen:

1. **Uitgeversidentiteit en eigendom:** `publisher-profiles.json` bevat 38 zorgvuldig afgebakende profielen met naam, expliciete aliassen, domein, land, taal, mediagroep, verificatiedatum en herleidbare bron. Een profiel zegt niets over de politieke inhoud of betrouwbaarheid van losse artikelen. Een onbekende eigenaar blijft onbekend.
2. **Waargenomen nieuws:** `/api/publisher-stats` leest echte opgeslagen metadata uit Neon PostgreSQL. Aantallen zijn unieke nieuws-URL's per publisher, samengevoegd over de zoekonderwerpen. De catalogus van ruim 280 merknamen is geen lijst van ruim 280 daadwerkelijk aangesloten feeds.
3. **Externe beoordelingen:** AllSides-biasprofielen en Eurotopics-redactionele oriëntaties blijven **verschillende kaders**. We vertalen Eurotopics `Left-wing` of `Centre-left` niet automatisch naar AllSides `Left` of `Lean Left`. De beoordeling van een uitgever is nooit een uitspraak over de feitelijke juistheid van zijn artikelen.

## Bronnen voor eigenaarstoewijzingen

- **DPG Media:** [DPG Media-merken](https://privacy.dpgmedia.nl/nl/document/brands-permissions) en [redactiestatuten](https://www.dpgmediagroup.com/nl-NL/over-dpg-media/redactiestatuten). Onder meer AD, de Volkskrant, Trouw, Het Parool, NU.nl, RTL Nieuws en een aantal regionale titels.
- **Mediahuis:** [officieel merkenoverzicht](https://www.mediahuis.com/nl/merken), waaronder NRC, De Telegraaf, Nederlandse regionale titels, EURACTIV en diverse Belgische dagbladen.
- **Nederlandse publieke omroep:** [Rijksoverheid, landelijke omroepen](https://www.rijksoverheid.nl/documenten/vraag-en-antwoord/media-en-publieke-omroep/welke-omroepen) voor NOS. Publieke financiering is géén politieke bias-score.
- **FD Mediagroep:** [eigen verklaring](https://fdmg.nl/over-ons/) voor FD, BNR en de HAL Investments-verbinding.
- **POLITICO / Axel Springer:** [persbericht over overname](https://www.axelspringer.com/en/ax-press-release/axel-springer-completes-acquisition-of-politico).
- **Follow the Money:** [overzicht eigen model](https://www.ftm.nl/over-ftm), inclusief ledenfinanciering; deze informatie wordt niet omgezet in een politieke rating.
- **Hart van Nederland / Talpa:** [Euromedia Ownership Monitor, Nederland](https://media-ownership.eu/2025-edition/country-reports/netherlands/), een onderzoeksbron en geen officiële aandeelhoudersverklaring.

OpenLens toont bij iedere gecontroleerde eigenaar een directe bronlink en de datum van de controle. Deze informatie kan wijzigen.

## Wat is werkelijk automatisch?

De uitgeverspagina leest `GET /api/publisher-stats`, met:
- `summary.articles`: aantal unieke gearchiveerde nieuwslinks.
- `summary.publishers`: aantal in de database waargenomen uitgeversidentiteiten.
- `summary.lastSuccess`: laatst geslaagde import.
- `publishers[].articles`: werkelijk opgeslagen artikelen per uitgeversidentiteit.
- `publishers[].topics`: aantal verschillende onderwerpen in de historische steekproef.

De persoonlijke live-scanknop vraagt de bestaande `/api/news` om nieuwsbronnen, maar neemt geen nieuwe artikelen op in de PostgreSQL-database. Hiervoor is de afzonderlijke beveiligde ingest nodig.

De resultaten zijn **onvolledig en afhankelijk van beschikbaarheid, zoekqueries, feedkwaliteit en indexeringsmomenten**. Een ontbrekende uitgever in de steekproef betekent niet dat een uitgever een gebeurtenis niet heeft behandeld.

## Links-rechtsdekking

De nieuwskaarten gebruiken een gecontroleerde deler:
- **Minder dan 3** extern beoordeelde uitgevers, of **minder dan de helft** van alle uitgevers beoordeeld: toon **aantallen en onbekende bronnen**, geen procentuele links-rechtsconclusie.
- Alleen bij een voldoende grote *beschikbare* steekproef tonen we percentages binnen beoordeelde uitgevers, mét de expliciete noemer en waarschuwing dat de steekproef niet representatief hoeft te zijn.
- Institutionele publicaties tellen nooit automatisch als `Center`.
- Een Eurotopics-oriëntatie telt nooit automatisch als AllSides-bias.

## Belangrijke grenzen

Deze versie controleert **38 profielrecords**, niet alle bronidentiteiten in het archief. Onbeoordeelde namen blijven gescheiden van geverifieerde aliassen. Sommige uitgevers voeren meerdere media, maar gedeeld eigendom bewijst geen gedeelde redactionele lijn. Lezers kunnen eigenaar en bronprofiel afzonderlijk onderzoeken.

Er is nog geen geautomatiseerd verificatieproces voor veranderingen in aandeelhouders, geen commerciële licentie voor externe biasdatasets en geen onafhankelijke landelijke links-rechtsclassificatie van alle Nederlandse media. Als OpenLens als betaald product wordt uitgebracht, moeten rechten en voorwaarden van deze gegevensleveranciers opnieuw gecontroleerd worden.

## Testen

```bash
npm run check
node --test tests/publisher-intelligence.test.mjs
```
