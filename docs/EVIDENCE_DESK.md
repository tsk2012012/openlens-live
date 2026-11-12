# OpenLens — stap 4: Evidence Desk (bron-voor-bron vergelijking)

**Gepubliceerd:** 12 november 2026.

## Wat deze functie doet

Een geopend verhaaldossier bevat nu het onderdeel **Wat noemen de bronnen?**. De gebruiker kan:

1. Tot **zes verschillende nieuwsuitgevers** binnen de huidige verhaalcluster vergelijken. Twee artikelen van hetzelfde medium tellen niet als twee onafhankelijke uitgevers.
2. Direct terugkerende **zichtbare vermeldingen uit koppen** bekijken, zoals 'Tweede Kamer', 'begroting' of een jaartal.
3. Met **Vergelijk openbare previews** de bestaande veilige `/api/article-preview` raadplegen. De API kan hooguit openbare `og:description`/uitgeversbeschrijvingen en korte toegankelijke artikel-leads vinden. Er is geen poging om betaalmuren of toegangscontroles te omzeilen.
4. Bij elke herkenning op de uitvouwbare vermelding klikken en zien **welke uitgever en welk type tekstbewijs** eraan ten grondslag ligt: kop, uitgeversbeschrijving of toegankelijke lead.
5. Een **afzonderlijk waarneembaar detail** zien wanneer dit slechts bij één van de gevonden bronnen in de kop of korte preview terugkomt.
6. Een JSON-onderzoeksdossier exporteren met bronnamen, URL's, korte getoonde snippets (maximaal 22 woorden per bron) en de beperkte onderzoeksmethode.

De preview is optioneel, wordt **uitsluitend op verzoek van de gebruiker** opgehaald en blijft maximaal 20 minuten in het browsergeheugen; inhoud wordt niet in de database opgeslagen. Mislukte previewverzoeken blijven expliciet herkenbaar als 'alleen kop'.

## Wat deze functie nadrukkelijk niet doet

- **Geen geverifieerde feiten**: terugkerende woorden of namen betekenen niet dat een beschreven gebeurtenis waar is. Trefwoordherkenning heeft geen waarheidswaarde.
- **Geen bewezen weglatingen**: een detail dat niet in een kop of beperkte preview staat, kan in het originele volledige artikel staan. De categorie **alleen zichtbaar bij één bron** betekent niet dat de andere uitgevers een detail hebben genegeerd.
- **Geen semantische feitextractie**: de beperkte meertalige woordenlijst en eenhedenherkenning zijn deterministische tekstmarkeringen, geen NLP-factcheck of AI-samenvatting.
- **Geen verificatie van onafhankelijkheid**: meerdere titels kunnen gezamenlijk een persbericht of persbureau publiceren, zelfs als ze verschillend eigendom hebben.
- **Geen volledige artikelen**: OpenLens leest of bewaart geen volledige artikelinhoud voor deze vergelijking. De parser haalt alleen beperkte bestaande openbare metadata/leads op en maakt die niet tot een 'volledige artikelanalyse'.
- **Geen correctiedetectie**: wisselende versies van een artikel worden nog niet over tijd vergeleken.

## Beveiliging, bronnen en provenance

- `evidence-core.js` gebruikt uitsluitend gecontroleerde detectiepatronen voor instellingen, personen, locaties, specifieke beleidsonderwerpen, handelingen, jaartallen en eenheden met cijfers.
- Elke signalering bevat links naar de originele gepubliceerde bron. Dynamische tekst wordt in de interface veilig ge-escaped.
- `story-evidence.js` laat maximaal zes bronnen zien en doet maximaal drie gelijktijdige requests, begrenst verzoeken op tijd en haalt niets op voordat de bezoeker expliciet op de knop klikt.
- `api/article-preview.js` accepteert alleen publieke HTTPS-bronlinks, controleert DNS/IP en valideert redirects; er zijn geen geheime tokens of nieuw betaalde bronnen nodig.
- De JSON-export is transparant over `fullTextVerified: false` en `storyLinkConfidence`; politieke oriëntaties en eigendom worden **niet** automatisch uit aangehaalde signalen afgeleid.
- Tekstuittreksels worden tot 22 woorden beperkt per zichtbare preview, met verwijzing naar de oorspronkelijke uitgever.

## Testplan

```bash
npm run check
node --test tests/evidence-comparison.test.mjs
```

De acht unit-tests testen herhaalde termen, unieke termen, duplicaten van hetzelfde medium, herkomst uit uitgeversbeschrijving en toegankelijke lead, afwijzing van niet-ondersteunde previews, publieke HTTPS-URL's en de preview-tekstlimiet.

Bij het uitrollen controleren we dat de homepage en de twee modules `/evidence-core.js` en `/story-evidence.js` HTTP 200 geven. Een volledige browser-/DOM-browsertest van gebruikersinteractie vergt nog extra end-to-end testautomatisering.

## Vervolg

- Handmatig gelabelde artikelparen met correcte gebeurtenis-ID, gebeurtenisbewering en aanwijsbare bronpassages.
- Waar juridisch en technisch mogelijk korte, gelicentieerde passages van uitgevers en originele persberichten toevoegen.
- Claim-clustering en tijdsverloop pas aanbieden na menselijke evaluatie van precisie en bronkwaliteit.
- Eigendom en bias nooit gebruiken als proxy voor waarheidswaarde.
