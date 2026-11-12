# OpenLens stap 2 — betrouwbare verhaalclustering

## Waarom deze wijziging?

De eerste versie groepeerde artikelen uitsluitend via een vaste drempel op woordoverlap. Dat kon verschillende gebeurtenissen onder één verhaal zetten. Sinds 12 november 2026 gebruikt de nieuwsfeed `story-cluster-core.js` (versie 2.0).

## Hoe de koppeling werkt

1. Normaliseer koppen (hoofdletters, accenten, leestekens) en sla generieke stopwoorden over.
2. Herken een **beperkte, expliciete woordenlijst** met overeenkomende Nederlandse, Engelse, Duitse en Franse termen. Bijvoorbeeld `Tweede Kamer` en `Dutch lower house`, `woningbouw` en `housing`.
3. Vergelijk betekenisdragende woorden, een gecureerde set entiteiten en geografische ankers. Ten minste meerdere inhoudelijke overeenkomsten zijn nodig.
4. Vermijd bekende onwaarschijnlijke combinaties: uiteenlopende landen, verschillende genoemde jaren, tegengestelde goedkeuring/afwijzing en koppen meer dan 96 uur uiteen (wanneer datums bekend zijn).
5. Voorkom het **kettingeffect**: een nieuw artikel moet overeenkomen met de eerste groepskop en maximaal twee extra groepskoppen; alleen overeenkomst met één willekeurige groepsgenoot is niet genoeg.
6. Geef elk cluster een zichtbaar label:
   - **Sterke kopovereenkomst** — automatische hoge woord-/entiteitsoverlap, **niet bewezen dezelfde gebeurtenis**.
   - **Voorlopige kopovereenkomst** — gedeeltelijk matchend, extra menselijke controle gewenst.
   - **Afzonderlijk bericht** — geen voldoende sterke match binnen de huidige steekproef.

Het onderliggende getal is een **heuristische samenhangsscore**, géén gekalibreerde waarschijnlijkheid en **geen factcheck**. We tonen daarom geen schijnprecies betrouwbaarheidpercentage.

## Grenzen en journalistieke voorzichtigheid

- Dit is nog **geen echte meertalige NLP-embeddinganalyse**. De woordenlijst dekt maar een klein deel van talen, eigennamen, verbuigingen en politieke onderwerpen.
- Gelijke tekst bewijst geen gelijke gebeurtenis. Verschillende tekst betekent niet dat het verschillende gebeurtenissen zijn.
- We gebruiken de beschikbare feed-/publicatie-/indexdatum. Indexering is niet noodzakelijk de oorspronkelijke publicatie; daarom geldt de tijdgrens als *heuristiek*.
- Een bron of land niet in de gevonden steekproef is geen bewijs dat deze bron iets heeft genegeerd.
- Politieke oriëntatie is een eigenschap van extern beoordeelde uitgevers en mag niet worden afgeleid uit de koppen of de clustermethode.
- Bij het ontbreken van de clustermodule vallen we terug op **afzonderlijke artikelen**, niet op het oude agressieve groeperingsalgoritme.
- Vóór commerciële uitrol zijn evaluatie op handmatig gelabelde Nederlandse en Europese nieuwskoppen, bias-validatie, betere uitgeveridentiteiten en robuuste event-ID's nodig.
- Opgeslagen verhaal-ID's kunnen wijzigen wanneer de samenstelling van een cluster verandert; bestaande leeslijst-snapshots blijven afzonderlijk opgeslagen.

## Tests

`tests/story-cluster.test.mjs` dekt onder andere meertalige positieve matches, verschillende landen en jaren, tegenovergestelde parlementaire besluiten, tijdgrenzen en het voorkomen van kettingclustering.

```bash
npm run check
# of alleen:
node --test tests/story-cluster.test.mjs
```

De tests garanderen nog geen journalistieke nauwkeurigheid op echte nieuwsdata. De volgende kwaliteitsstap is een vaste dataset van handmatig beoordeelde, meertalige artikelparen en metingen van precisie/recall.
