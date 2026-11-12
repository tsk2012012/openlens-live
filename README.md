# OpenLens — News comparison and daily review

A polished, self-contained news review website that runs on desktop and iPhone. It can fetch current news headlines without requiring an API key, and it always has a **clearly marked illustrative demo** when news sources are unavailable.

## Try it

- **No installation:** Open `index.html` in your browser. On supported browsers, it fetches GDELT headlines directly (CORS permitted). On others, it shows the demo rather than a blank page.
- **With live Google News RSS:** Install Node.js 20+, run `npm run dev`, and open **http://localhost:3000**. The server provides `/api/news`, so browser CORS issues with RSS are avoided.
- **Publish it online:** Push all files to a GitHub repository, import the repository on Vercel, and deploy with the defaults. Vercel will serve `index.html` and the serverless `api/news.js` endpoint. You do not need environment variables or API keys for this basic prototype.

## Stap 1: persistent nieuwsarchief (in voorbereiding)

**PostgreSQL is nu gekoppeld en de eerste import is voltooid op 12 november 2026.** Bij die import werden 606 unieke artikelen en 151 uitgevers opgeslagen, verdeeld over drie zoekonderwerpen (Nederland, Europa en Wereld). De bestaande live nieuwsfeed blijft zonder database werken.

- `GET /api/storage-status` — of de database verbonden is, opgeslagen artikelen en uitgevers, laatste import.
- `GET /api/stored-news?topic=netherlands&period=7` — gearchiveerde nieuwsmetadata, zodra de database is gevuld.
- `GET /api/ingest` — beveiligde Vercel Cron-import; vereist `CRON_SECRET` en `DATABASE_URL`.
- Import is in `vercel.json` **dagelijks om 04:17 UTC** gepland. De taak wisselt een selectie van zes NL/EU/wereldonderwerpen af.
- Normalisatie en opslag bewaren bronherkomst, timestamps en topic-koppelingen. Er worden geen politieke bias-scores uit headlines afgeleid.

**Geactiveerd:** Neon/PostgreSQL en `DATABASE_URL`/`CRON_SECRET` zijn voor productie geconfigureerd. Controleer `/api/storage-status` voor actuele cijfers. De reguliere Vercel Cron is dagelijks gepland; de eerste import is eenmalig beveiligd via de Vercel-build uitgevoerd.

De precieze veilige stappen staan in [docs/NEWS_DATABASE_SETUP.md](docs/NEWS_DATABASE_SETUP.md).

## Stap 2: betrouwbaardere verhaalclustering

Koppen worden nu conservatief gegroepeerd via meertalige termen, bekende namen, geografische aanduidingen, afwijkende besluiten en tijdvensters. Verschillende ongevallen op verschillende straten, tegenovergestelde parlementaire besluiten en verschillende conferentiesprekers blijven gescheiden. Elke nieuwskaart en elk verhaaldossier toont of een koppeling sterk, voorlopig of niet gemaakt is — **nooit als bewezen dezelfde gebeurtenis**. Er zijn 16 tests en er is een controle op gearchiveerde NL/EU/Wereld-koppen uitgevoerd. Zie [docs/STORY_CLUSTERING.md](docs/STORY_CLUSTERING.md).

## Stap 3: Publisher Intelligence met eigendomsbronnen

- **38 nagekeken Nederlandse en Europese uitgeversprofielen** in `publisher-profiles.json` met genormaliseerde merkaliassen, land, taal, type, naam van de mediagroep, verificatiedatum en eigendomsbron (waar bekend).
- De uitgeverspagina gebruikt nu het **echte Neon-archief** via `GET /api/publisher-stats` in plaats van de ongevulde legacy-`publisher-observations.json`.
- Een bronvermelding toont rechtstreeks de oorspronkelijke eigendomsbron. Andere uitgevers blijven expliciet onbeoordeeld.
- **Eurotopics-oriëntaties worden niet meer omgerekend naar AllSides-bias.** Politieke distributiebalken tonen bij onvoldoende steekproefgrootte aantallen, geen misleidende percentages.
- Eigendom, politieke oriëntatie, feitelijke correctheid, aanwezigheid in zoekresultaten en bronsoort blijven **verschillende begrippen**.

Gedetailleerde methodologie, bronverwijzingen en beperkingen: [docs/PUBLISHER_INTELLIGENCE.md](docs/PUBLISHER_INTELLIGENCE.md).

## Features

- Responsive story dashboard for phone and desktop
- Filters for topic, source country/news edition, source language, outlet, and date
- Multiple headlines side by side with source links and source/feed/indexing dates
- Tentative story grouping, headline overlap, and manually reviewed fact/omission matrices
- Editorial type signals: *Opinion signal*, *Analysis signal*, or *Unclassified*
- Known-outlet organizational ownership context and original metadata links
- **No fabricated bias ratings**; explicit “Bias: not rated” instead
- A dated list of available appearances of a story in the feed sample
- Saved stories, unresolved claims, manual claim-status update histories, and a local refresh log
- JSON export of visible headlines, source links, saved stories, and claims
- Accessible methodology screen explaining coverage and confidence gaps
- Demo fallback clearly labels example stories, publishers, and timestamps as fictional

## How news is retrieved

The optional Node/Vercel endpoint retrieves Google News search RSS for the chosen news edition and language and parses basic feed metadata. In a browser without this endpoint, OpenLens attempts the free GDELT DOC 2.0 article list API directly. If both fail, a clear **Demo data** badge is shown.

**Important source/date distinctions:**
- A GDELT `seendate` is an **indexed/observed timestamp**, not a publisher-supplied publication date.
- Google News RSS `pubDate` is a **feed date**, not an independently verified article date.
- Google RSS links typically redirect through `news.google.com` toward the source page.
- GDELT's country denotes an attributed **publisher country**; Google RSS's country denotes the **news edition**. These are not equivalent filters.
- “Not mentioned in sampled headlines” cannot establish that a fact was omitted from full reporting.
- Opinion/analysis labels are keyword heuristics and *Unclassified* is not a reporting certification.
- Automated grouping uses token similarity, not verified event matching. Verify same-event status before interpretation.
- GDELT and Google News are distinct sampling mechanisms and have different ranking, language, accessibility, and coverage limitations.

## Privacy and data persistence

Your saved stories and claim histories use `localStorage`. They stay in the browser, not in a hosted account; clearing website data can erase them. Use **Export review** to create a portable JSON backup. The website has no login, tracking pixels, or analytics SDK.

## Next production iterations

A full Ground News-equivalent would need rights-cleared article ingestion, durable historical snapshots, verified outlet identity, independent and citable political-bias assessments, full-text claim extraction with citation-level provenance, ongoing updates, user accounts, and push notifications. This MVP does not pretend to provide these capabilities.

## Source documentation

- [GDELT DOC 2.0 API](https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/)
- [Google News](https://news.google.com/)
- [AllSides rating methodology](https://www.allsides.com/media-bias)
- [Ad Fontes Media](https://adfontesmedia.com/)

OpenLens is an independently built prototype, not affiliated with Ground News or any publisher.

## Synchronized production files (November 2026)

The current Vercel design is also in this repository: index.html, bias-extension.js, article-preview.js, and layout-redesign.js. Do not confuse article-preview.js (browser UI) with api/article-preview.js (Node serverless handler). Both are essential.

The ivory and teal layout offers compact navigation, collapsible filters and story-level Coverage, Perspectives, Evidence, Timeline tabs. Source political-leaning labels retain their attributed blue-to-red legend. Unrated and institutional sources are separate.

The news API merges a general Google News RSS sample with two explicitly supplemental right-publisher discovery searches for US/English editions. Publisher proportions are not representative of the news ecosystem. Headlines are not a verified full-article omission audit.

Article previews show the headline immediately. Google News aggregation links do not provide original publisher text. Direct publisher links may provide a description or short lead; these are not complete AI summaries.

Use npm run check before pushing. Keep API handlers and browser scripts together, so future deployments do not override features.

## Focused news topics (November 2026)

The Explore page provides quick-access chips and a full topic selector for Migration, Dutch national politics, Gaza, Ukraine, Geopolitics, Middle East and EU policy. Selecting one triggers a dedicated Google News RSS search; GDELT has matching fallback queries. Dutch national politics defaults to the Netherlands/Dutch news edition unless the user selects another country or language. The selected query controls which fetched headlines are shown, so headline keyword classification does not accidentally hide relevant articles. These are incomplete samples and do not prove same-event matches, editorial omissions, or article truth.

## Source audit (November 10, 2026)

OpenLens now distinguishes source category, independent AllSides publisher bias ratings (with dated review and source links), and sources whose political leaning is not independently assessed. `source-audit.js` uses only **exact normalized publisher names**, avoiding false matches to company parents or similarly named local affiliates. It has a source-type registry for government/legislative bodies, UN and international agencies, research organizations, advocacy nonprofits, news wires, public broadcasters, local publishers, commercial outlets, trade journals, and social platforms. The source-audit disclosure on the dashboard lists each current publisher and its type and rating evidence, including unresolved identity reviews. Source types describe publisher role, not truthfulness. AllSides labels refer mainly to online U.S.-politics reporting and are not transferable to Dutch left/right party politics or article factuality. Verified ratings should be periodically rechecked against their profile URLs; not all news outlets are independently rated. If no assessment exists the app never fabricates a Left/Center/Right rating.

### Expanded identity audit review

Expanded exact-name source-type labels across the sampled topic feeds. The registry now distinguishes public-service broadcasters, local newsrooms, news agencies, specialist publications, businesses, universities, research institutes, government agencies, UN institutions, NGOs, political organizations and platforms. Identity typing is not proof of objectivity, credibility, or editorial position. New `tests/source-audit.test.mjs` protects against invented bias labels and accidental omission of the source-audit script in local development.

### Final spot checks in nine topic feeds

Resolved the latest unmatched names including WTOK, WRAL, Iowa Capital Dispatch, National Catholic Reporter, Genfinity, JournalArta, Britannica, Wood Mackenzie, Bioengineer.org and Travel Market Report. These are role/type identifications; only outlets with published independent ratings receive a political category. New or renamed sources appearing in future feeds may still require manual identification.

## Local editorial evidence review

The evidence-review workspace is a **personal research tool**, not an automated bias-rating engine. Reviewers confirm reading original publisher articles and record URL, date, topic, national political context, content format, framing observation, source-selection details, and their own name/initials. Observations are subjective and reviewer identities are self-reported. To make a working publisher interpretation eligible for review, the local dataset must cover 15 distinct articles, three topics, three reviewer aliases, and publication dates spanning 21 days. The app may then store a locally proposed interpretation with a substantive explanation, but it never enters the independent AllSides rating chart. This is inspired by multipartisan, multi-article review principles used by AllSides and Ad Fontes; it is not a certified rating. Data stays on the device unless exported.

### Review lab interface

Choose **Editorial reviews** in the main navigation. The review queue lists currently unassessed news publishers from the selected live feed; the source-audit list and the individual article comparison also have `Review evidence` shortcuts. A detailed local form captures direct publisher URL, topic, political reference frame, article format, selected framing dimension, reviewer notes and confirmation of having read the original article. Review progress tracks distinct articles, topics, reviewer aliases and timespan before a private interpretation can be drafted. Local research can be exported as JSON and imported back later; no review is uploaded and no local interpretation is injected into the third-party AllSides publisher ratings or the political-spectrum charts.

## Original publisher links and source-backed article previews

When a reader opens a Google News RSS article, the server attempts to resolve its original publisher link using Google News's undocumented Fbv4je redirect metadata protocol. Resolution happens on demand only, not across the whole feed. The server validates public HTTPS publisher URLs before loading public article HTML, sets request timeouts and size limits, and never bypasses paywalls. Where accessible it shows the publisher's description and/or a short extract from the article lead, each labeled by provenance; these are not independent AI-generated full-article summaries or fact checks. If Google changes the redirect format, rate-limits the service, or the publisher blocks access, the app keeps the headline and Google News fallback link without inventing an article summary.

## Product navigation and favicon refresh

The commercial-style product shell introduces a scalable SVG favicon, matching logo, clearer typography and a focused main workflow. The primary navigation is Explore, Publishers, Saved stories and How it works. The old Claims tool is now named Research questions, and the manual Editorial Reviews tool is now Editorial lab; both remain accessible under Advanced research, without removing saved local data. Neither feature provides automatic fact-checking or an independent published publisher rating.

The publisher directory shows source categories and externally attributed ratings for sources currently in the feed. Unrated never means Center, and government, academic, NGO and other non-news sources are categorized separately. The directory is not an exhaustive dataset or an article accuracy score.

## Editorial-first exploration (November 2026)

Explore now opens on a spacious editorial newsfeed with a featured story and multiple cards, rather than automatically showing a dense story-comparison dashboard. A chosen story opens a focused reader page with headline provenance and a full-width comparison. All existing bias statistics, publisher links, article previews, manually reviewed evidence notes, timeline, bookmarks, publisher directory, and advanced research features remain available through existing components and local storage. On the browse page, aggregate sampled-publisher statistics are tucked into an optional disclosure; inside a story, detailed analysis is visible in labeled tabs. The app does not generate unsourced story summaries or claim that title overlaps prove same-event matches or omissions.

## Story Watch and Netherlands / European public-affairs focus (November 2026)

Story Watch is available in the main navigation and from the story cards/reader. Follow an issue using distinctive keywords or watch a live story with its initial links already marked as seen. Press **Check for coverage** to search recent Google News NL and English-language European feeds; only newly encountered links matching at least two keywords are highlighted. Results are **possible keyword matches**, not verified changes to one event. Checks run only on explicit user interaction; there is no scheduled polling, notification service, account sync, or AI fact-checking. Data and search history are stored in localStorage and can be exported. The legacy manual research-question list remains accessible in Advanced research.

Dutch and EU public-affairs topics now include housing, tax and public finance, labour, social policy, healthcare, education, municipalities, agriculture, energy transition, digital policy, law, and defence. The default broad news edition is Netherlands/Dutch for Dutch-oriented topics, with transparent extra discovery queries for Dutch national and regional publishers, European outlets and primary institutional documents. The search methods are **not** a representative political sampling frame. Other country and language selections still work. A publisher's inclusion is not a quality or political-bias endorsement.

## Story Watch: official parliamentary and EU publication milestones

The manual Story Watch check now also retrieves direct Dutch Tweede Kamer OData v5 activities, cases, and documents, plus EUR-Lex Commission proposal and legislative publication feeds. Official records are presented in a separate panel under each watch and linked directly to the machine-readable official record. The app labels each event with its recorded source type and any explicit parliamentary activity status. It does **not** infer that a planned debate or a parliamentary filing is a completed vote or enacted law, and it does not reconstruct complete EU procedure timelines, parliamentary decisions, amendment votes, or European Parliament vote results.

Matches are **heuristic keyword matches** and can be unrelated to the tracked story; inspect the original documents before citing a linkage. Each manual check maintains its own local record ID+status fingerprint so changed and newly discovered entries are surfaced separately from news headlines. The user can request an official-record refresh without refreshing news. Official results are stored locally and separately from the existing Story Watch storage and can be cleared with the watch. If a source is unavailable or responds with no matching records, the UI makes that limitation explicit. There is no background polling, alerting or independent political assessment.

Official source references: https://opendata.tweedekamer.nl/ and https://eur-lex.europa.eu/content/help/search/predefined-rss.html?locale=en.

Official-record research can be exported separately from media matches using **Export official timeline** in Story Watch. This includes source identifiers, status labels, match caveats, and the local check history.

## Dark mode, source images, source-spectrum bars and blindspot analysis

The newsroom interface now has a persistent light/dark toggle, source-backed images when publisher Open Graph or RSS metadata supplies them, and explicitly attributed Left / Center / Right bars on story cards and reader pages. Images are not generated or guessed; publisher metadata can be unavailable or blocked and then the UI uses a neutral graphic. Image discovery loads lazily for visible cards. Coverage percentages use only distinct named publishers with an attributed political rating as denominator; institutions and unrated sources remain visible as additional counts and are never assumed to be Center. A singleton rated publisher does not establish a representative distribution.

Topics are now browsed under Uitgelicht, Nederland, Europese Unie, Economie & beleid, Samenleving and Internationaal, while the existing full topic dropdown remains available. A separate Blinde vlekken page and preview show **potential sampled-source perspective gaps**, sparse source classification, and stories with only one sampled publisher. These are not verified factual omissions or evidence of deliberate withholding. The data remains a nonrepresentative Google News/GDELT sample with tentative headline clustering. All main views, Story Watch, publisher profiles and local saved research are preserved.

## Blindspot audit v2: honest sampled coverage and source classification

The Blindspots navigation no longer repeats 'insufficient classifications' on dozens of cards. It opens an overview showing candidate perspective gaps only when independent published outlet orientation evidence covers enough unique publishers; a small multi-publisher headline sample does not meet that threshold. Separate views contain: comparisons of stories with several detected publishers, a ranked **publisher research queue** (identity confirmed but no political evaluation versus identity genuinely unverified), and one-source sample limitations. No article or publisher gets a guessed Center label. Eurotopics categories are shown with their original wording; explicitly Left-wing, Centre-left and Right-wing profiles have a cautious crosswalk, while Liberal, Christian, and Liberal-conservative are not forced onto the same axis. Eurotopics and AllSides are different political-context and rating methodologies.

Verified editorial-orientation profiles added from Eurotopics in November 2026 for De Telegraaf (Right-wing), de Volkskrant (Centre-left), De Groene Amsterdammer (Left-wing), and De Morgen (Left-wing). NRC, Trouw, AD, De Correspondent, Het Financieele Dagblad and POLITICO Europe retain their exact Eurotopics descriptions instead of forced left/right scores. See linked individual publisher profiles in the Publisher Directory. The Eurotopics editorial orientations and AllSides political coverage ratings are not statistically interchangeable and do not measure article truth.

## Multi-provider article comparison and source-aware research dossiers

The news endpoint includes original NOS and NU newsroom feeds (plus POLITICO Europe where available), independent GDELT DOC 2.0 article discovery (subject to upstream availability) and Google News RSS. Provider availability and discovery provenance remain visible in the response. Missing upstream providers never cause the whole news feed to fail. News links, headlines, dates, and source identities are not full publisher article text. Indexed dates and publisher publication dates have different meanings.

Inside each story, the new **Zoek aanvullende bronnen** action searches Dutch- and English-language Google News plus GDELT for possible links using salient headline keywords. It shows unverified title-similarity candidates and recorded source/index dates, not verified identical-event matches or proven editorial omissions. The user can manually mark candidates as the same event or different events, save individual research notes, and export source-linked JSON dossiers. Dossiers stay in browser localStorage, not remotely synced. Original publisher headlines and sources are cited by links, not reproduced as articles. Authenticated publisher APIs (e.g., Guardian Open Platform) can be added later using server-side keys only and respecting commercial terms.

Additional original-feed connections (availability may change): NRC, De Telegraaf, de Volkskrant, Trouw, AD, DutchNews.nl and NL Times. Direct source feeds have independent source statuses; if the upstream publisher endpoint blocks automated requests or changes its RSS URL, it is reported unavailable rather than silently fabricated.
