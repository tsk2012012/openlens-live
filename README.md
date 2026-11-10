# OpenLens — News comparison and daily review

A polished, self-contained news review website that runs on desktop and iPhone. It can fetch current news headlines without requiring an API key, and it always has a **clearly marked illustrative demo** when news sources are unavailable.

## Try it

- **No installation:** Open `index.html` in your browser. On supported browsers, it fetches GDELT headlines directly (CORS permitted). On others, it shows the demo rather than a blank page.
- **With live Google News RSS:** Install Node.js 20+, run `npm run dev`, and open **http://localhost:3000**. The server provides `/api/news`, so browser CORS issues with RSS are avoided.
- **Publish it online:** Push all files to a GitHub repository, import the repository on Vercel, and deploy with the defaults. Vercel will serve `index.html` and the serverless `api/news.js` endpoint. You do not need environment variables or API keys for this basic prototype.

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
