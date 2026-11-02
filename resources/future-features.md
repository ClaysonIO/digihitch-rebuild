# Future features for the digihitch rebuild

A prioritized roadmap for the static GitHub Pages rebuild. It covers features beyond the core per-state and per-province hitchhiking-laws reference.

All evidence cited here comes from `resources/digihitch-original-site.md`; section numbers like §5.5 refer to that file. Each entry has these fields:

- **What**: the feature.
- **Why / original evidence**: what the old site had, labelled *confirmed* or *inferred*.
- **How**: a suggested implementation on a static site.
- **Data & licensing**: where the data comes from and any reuse limits.
- **Effort**: S (≤ 1 day), M (a few days), L (a week or more).

Ground rules for everything below:

- **No archived article text is reused without permission.** The archive's content is not MIT-licensed.
- **Statutes are always re-sourced from current official sites**, never copied from the 2002–2008 pages.
- **No automated Wayback fetching.**

---

## NOW (ship alongside or right after the laws reference)

### 1. Printable regional law handouts

- **What**: A one-page or two-page print layout per region that bundles the laws for several states or provinces. Each jurisdiction gets:
  - its status badge and one-line verdict
  - two or three key rules
  - its citations
  - a "last verified" date
  - a QR code or URL back to the full page

  There is also a per-jurisdiction print view.
- **Why / evidence**:
  - The brief says the original had printable regional handouts. **This is not confirmed by the archive** (§5.6): no "handout", "print" or "PDF" references survive. The likely origin is PHP-Nuke's built-in "Printer Friendly Page" link, or static pages outside the dump.
  - What is confirmed is that law pages were very popular and practical: all 50 states were covered, plus city ordinances, and the UK page had 1,133 views (§5, §8).
  - A 2003 title, "Hitchhiking Culture Jam: Our feet, your flyers", shows a flyer and print culture in the community.
- **How**:
  - Generate `/handouts/<region>/` pages at build time from the same law Markdown/YAML front matter, grouping on the existing `region:` field (for example `US_UT.md` has `region: Mountain West`).
  - Use `@media print` CSS for the page setup: A4/Letter, black and white, no navigation, page breaks between jurisdictions, and URLs printed after links.
  - Add a "Print" button (`window.print()`).
  - Optionally render PDFs in CI with headless Chromium (Playwright) and commit them as release assets. Pages serves them as static files.
  - Generate the QR codes at build time (for example with the `qrcode` npm or Python package) as inline SVG.
- **Suggested regions** (our proposal; the original's grouping is unknown):
  - US: use the `region` field you already have (Mountain West, etc.), or US Census divisions for neutrality.
  - Canada: BC; Prairies (AB/SK/MB); Ontario; Quebec; Atlantic (NB/NS/PE/NL); North (YT/NT/NU). This mirrors the original Canada section's per-province topics (§4.3).
- **Data & licensing**: Our own summaries plus short statute quotations from official sources. Put the "Not legal advice" disclaimer and the verification date on every page.
- **Effort**: **S–M**

### 2. Law-change tracking and "last verified" transparency

- **What**: Every jurisdiction page shows `last_verified`, a changelog (for example "2017 H.B. 161 removed 'soliciting rides'"), and a link to the official source. A site-wide "Recently changed" page lists updates.
- **Why / evidence**:
  - The original law pages were written from 2002 to 2008 and never carried a verified date or structured status (§5.5).
  - Laws have since changed. Utah removed its ride-solicitation wording in 2017, per `resources/laws/US_UT.md`. That makes stale pages a real risk.
- **How**:
  - Keep `last_verified` and `key_citations` in front matter (already in the template) and add a `history:` list.
  - Build a "Recently verified/changed" page from git log or front matter.
  - Add a scheduled GitHub Action (weekly) that link-checks every official source URL with `lychee`. When a source 404s or redirects, it opens or updates an issue labelled `law-source-broken`.
  - Optionally store a SHA-256 of each source page's statute text and open an issue when it changes. Use polite rate limits and official legislature sites only.
  - Flag pages older than N months as "needs re-verification".
- **Data & licensing**: Official legislature sites. Respect their robots.txt and terms, and keep request volume tiny.
- **Effort**: **S** (badges, changelog) to **M** (diff watcher)

### 3. Community corrections via GitHub Issues and PRs

- **What**: Issue forms for "Report a law change or error", "Add a city ordinance", "Submit a spot", and "Takedown/privacy request", plus a CONTRIBUTING guide for direct PRs to `resources/laws/*.md`.
- **Why / evidence**:
  - The original ran on volunteer research. Many law pages came from contributors, not just the founder: ontheroad wrote 12 state pages, elguero and Morgan one each, and highadventures 27 city pages (§5.1, §5.3).
  - It also had dedicated forums: "Research and Road Teams… including laws" and "North America – Hitchhiker Road Team… developing quality USA & CANADA resources" (§4.9).
- **How**:
  - Add `.github/ISSUE_TEMPLATE/*.yml` forms with required fields: jurisdiction, citation, official URL, and what changed.
  - Add an "Edit this page on GitHub" link on every law page.
  - Add a PR template with a checklist: official source linked, verbatim quote checked, `last_verified` updated.
  - Use CODEOWNERS for review.
  - Contributor licensing: state that new contributions are under a license such as CC BY-SA 4.0 for text, and add a DCO sign-off line.
- **Data & licensing**: This decides the license of all future content up front, which avoids the original's "rights stay with authors" dead end.
- **Effort**: **S**

### 4. Legal-status map (choropleth)

- **What**: A clickable US + Canada map coloured by `status` (legal / restricted / prohibited-on-roadway / etc.) that links to each jurisdiction page.
- **Why / evidence**:
  - The original had region maps. Forum descriptions mention a "USA map", "Latin America map", "Middle East map" and "Oceania map". `CountryTBL` stores a lat/long and zoom per country (§4.6, maps confirmed; implementation unknown).
  - "Is it legal here?" was the key question users brought (§8).
- **How**:
  - Use a static inline SVG of US states and Canadian provinces/territories, with no tile server. Colour regions from a build-generated `laws.json`.
  - Add an accessible table fallback and a colour-blind-safe palette.
- **Data & licensing**: Public-domain or CC0 boundary SVGs (for example Natural Earth, which is public domain, simplified). No API keys.
- **Effort**: **S–M**

---

## NEXT

### 5. Municipal and city ordinance notes

- **What**: Optional `local_rules:` entries per state or province (city, ordinance citation, summary, source URL, verified date), shown on the state page and in handouts as "Watch out in…".
- **Why / evidence**:
  - The original had 27 city-level law pages in 2007, e.g. Asheville NC, Little Rock AR, Mobile AL, "Cities along I-95 in Florida", Newark DE (§5.3).
  - There was also "Salt Lake City hitchhiking law" (2003).
  - Both surviving province and UK pages warn that "some cities or towns have their own laws" (§5.5).
- **How**: Use a YAML list in front matter or a separate `resources/laws/local/<code>.yml`, with the same verification rules. Use the old city list as a **research checklist** (the titles are facts) and re-research each ordinance from current municipal codes, such as official city sites, Municode or American Legal.
- **Data & licensing**: Municipal codes are generally public law. Don't copy old digihitch text.
- **Effort**: **M**, and it grows with coverage.

### 6. Structured spot guides

- **What**: Per-spot pages (for example "Hwy 17 East, Sudbury → Ottawa") with structured fields and a short "how to get there" text.
- **Why / evidence**:
  - The Canada section had 24 form-generated spot reports with a fixed template (§4.5):
    - Route, Location, Destination
    - Overall Rating (Excellent/Good/Average/Poor)
    - Method (Gesture/Sign/Thumb), sign text
    - Number of Hitchhikers, Amount of Traffic, Waiting Time (bucketed)
    - Time of Day, Type of Day, Weather
    - Nearby Business, Directions (often transit bus numbers), Extra Info
  - Spot and route guides are among the most-viewed archived content (§8). Many US "Hitchhiking I-80 Exit N near…" posts suggest the same template was used in the USA.
- **How**:
  - One YAML file per spot in `data/spots/`, using the original field set as the schema plus lat/lon, `last_visited` and `submitted_by`.
  - A GitHub Issue Form "Submit a spot" with dropdowns that match the original enums. A GitHub Action parses the issue and opens a PR (for example with `stefanbuck/github-issue-parser`).
  - Show each spot's jurisdiction law status inline, which links spots to laws.
- **Data & licensing**: New community submissions under the contributor license. Do **not** import the 24 archived spot texts without author permission. Their structured facts (road, town, rating) may be used as leads to re-verify. For coverage, consider linking to or integrating **Hitchmap / Hitchwiki spot data** (ODbL); ODbL requires attribution and share-alike for derived databases.
- **Effort**: **M**

### 7. Interactive map of spots

- **What**: A Leaflet map of spots (and later truck stops and gatherings), filterable by rating and route.
- **Why / evidence**: Map-based browsing existed (§4.6) and spot guides were valuable (§8).
- **How**:
  - Leaflet loaded from a pinned CDN version, with a GeoJSON file generated at build time.
  - OSM-based tiles from a provider whose usage policy allows this traffic, or self-hosted vector tiles (PMTiles on Pages).
  - The SVG law map from item 4 can be an overlay.
- **Data & licensing**: Credit OSM tiles ("© OpenStreetMap contributors") and follow the tile usage policy.
- **Effort**: **M**

### 8. Highway and corridor guides

- **What**: Pages per major corridor, such as I-80, I-90, I-10, I-95, the Trans-Canada (Hwy 1/17), Hwy 11 and the Yellowhead. Each lists:
  - per-state legal notes along the route (for example "Interstate shoulders prohibited in X")
  - good on-ramps and spots
  - truck stops and service areas
  - known problem points
- **Why / evidence**:
  - The original tagged stories by highway (`xhwy`) and had "{ST} – Truck Stops (I-nn)" pages per state and Interstate (15 titles).
  - It also had "United States Interstate System – from a hitchhiker perspective", "I-10 Hitchhiking Ideas", "Hitchhiking the Transcanadian Highway West from Ottawa", and an unfinished `eu_region_hwy` table of 98 European E-roads (§4.7, §4.2).
  - The "Canada by Province, Route or Cross-Country" and "USA by State, Route…" forums were among the largest boards (§4.9).
- **How**: Use a `data/corridors/<id>.yml` file that lists the jurisdictions crossed (in order) and spot IDs, then render each page by joining laws and spots. Truck stops can come from an OpenStreetMap Overpass query (`amenity=fuel` + `hgv=yes`, or `highway=services`) run **manually or monthly** and committed as GeoJSON (ODbL).
- **Data & licensing**: OSM data under ODbL, which requires attribution and share-alike for the extracted dataset.
- **Effort**: **M** per few corridors; **L** for broad coverage.

### 9. Site search

- **What**: Client-side full-text search across laws, local rules, spots and corridors.
- **Why / evidence**: The archive SPA already relies on client search over `search-index.json`. The original also had tag vocabularies with misspelling and multilingual synonyms (§4.8).
- **How**: Use **Pagefind**, a static index built in CI with no server, or a small Lunr/MiniSearch index. Seed synonyms from our own list modelled on the original tags (hitchhike/hitch-hike/autostop/trampen/liften).
- **Data & licensing**: Our own content only.
- **Effort**: **S**

### 10. Police-encounter and safety page

- **What**: Short, sourced guidance: what pedestrian and solicitation laws usually mean in practice, what to carry, travel-partner and check-in habits, and emergency numbers. It links to each jurisdiction page rather than giving legal advice.
- **Why / evidence**:
  - Original titles include "Dealing with Arizona Cops", "Police say hitchhiking is illegal in Delaware…", "The Hitchhiker Field Interview – Get a Report" and "Remember Your Rules".
  - Forums included **CHECK IN!** ("post your general plans… so we can help watch out for each other"), Find Someone, and Extreme Hitchhiking (§4.9, §5.2).
- **How**: A single Markdown page, reviewed carefully, with citations and a clear "not legal advice" banner.
- **Data & licensing**: Our own writing, citing official sources.
- **Effort**: **S**

---

## LATER

### 11. Stories and articles: link out first, import with permission

- **What**: A "From the digihitch archive" section that **links** to the Hitchwiki memorial archive (`hitchwiki.github.io/digihitch`, `#/article/...`) for historical trip reports. Over time, re-publish selected pieces whose authors (or Salman's estate) grant permission.
- **Why / evidence**:
  - Stories were the bulk of the site: 2,403 indexed titles, and about 251k recorded views across the 291 surviving bodies (§4, §8).
  - The top archived piece, "Hitchhiking in Italy", has 15,123 views.
- **How**:
  - Start with curated link lists by region, which need no copying.
  - For imports, track permission per article in `data/permissions.yml` (author, contact date, licence granted).
  - Never import news reprints (Edmonton Journal, Globe and Mail, Ottawa Citizen, Ananova, etc.). They are third-party copyright.
- **Data & licensing**: **Blocked without permission.** Authors are mostly pseudonymous (hikecrazy, Lightfoot, ontheroad…). Coordinate with Hitchwiki maintainers, who run the archive's takedown and corrections process.
- **Effort**: **S** (links); **L** (permissions outreach and editing)

### 12. Europe and world law pages

- **What**: Extend the laws reference beyond the US and Canada, starting with the UK and Ireland, then other European countries.
- **Why / evidence**: The original had "Hitchhiking Laws in the UK for England, Wales, Scotland, Northern Ireland" (2006, 1,133 views), quoting the Highway Code with legal citations and the driver-side motorway pick-up ban (§5.4, §5.5).
- **How**: Use the same schema, with `country: GB` and sub-jurisdictions. Link to Hitchwiki country pages for practical tips.
- **Data & licensing**: UK legislation and the Highway Code are under the Open Government Licence (attribution). Check each country's terms.
- **Effort**: **L**

### 13. Glossary / encycloPEDia

- **What**: A glossary of road and hitchhiking terms (roadway vs shoulder, limited-access, "solicit a ride", on-ramp, controlled-access), plus multilingual terms for hitchhiking.
- **Why / evidence**:
  - The original launched "encycloPEDia" in 2002 (title only).
  - Its tag table holds synonyms in Dutch, Italian, German and other languages: autostop, liften, liftare, trampen (§4.8, §6).
  - The BC page shows that *definitions* such as "roadway excludes the shoulder" decide legality (§5.5).
- **How**: Use `data/glossary.yml`, render it as a page, and auto-link terms on law pages with `<abbr>` or tooltips.
- **Data & licensing**: Our own definitions, quoting statutory definitions with citations.
- **Effort**: **S–M**

### 14. Events and gatherings calendar

- **What**: A list of hitchhiking gatherings, races and meetups, with an `.ics` feed.
- **Why / evidence**: The original had Hitchhiker Gatherings (Toronto, Seattle), a Scavenger Hunt, race announcements, and the "Hitchhiker Gatherings & Happenings" and "Hitchhiker Races…" forums (§4.2, §4.9, §6).
- **How**: Store events in `data/events.yml`, add them via issue form or PR, and generate a static `events.ics` at build time. Prune past events automatically in CI.
- **Data & licensing**: Community-submitted facts.
- **Effort**: **S**

### 15. Travel partners and check-in: link, don't build

- **What**: A resource page pointing to existing communities for finding travel partners and checking in, rather than a new forum.
- **Why / evidence**:
  - "Sidekicks" travel-partner boards were huge: USA Sidekicks had 1,474 topics, the most of any board.
  - "CHECK IN!" and "Find Someone" show the demand (§4.9).
- **How**: A static site can't host this safely; it would need accounts, moderation and privacy controls. Link to established platforms (Hitchwiki and its community channels, Trustroots, etc.). GitHub Discussions is an option for site-related conversation only.
- **Data & licensing**: None. Avoid collecting personal travel plans on our site.
- **Effort**: **S** (link page)

### 16. Offline / pocket mode (new; not on the original)

- **What**: A PWA that caches laws and handouts for use on the road without signal.
- **Why**: This isn't grounded in the original site. It extends the "printable handout" need to phones.
- **How**: A service worker (Workbox) that pre-caches law pages and `laws.json`, plus a web app manifest.
- **Effort**: **S–M**

---

## Considered, not recommended now

- **Runaway or youth-law pages.** The original had "Runaway Laws in Florida/Texas/California" and a 2003 crowd-research call (§5.2). This is sensitive child-safety territory and out of scope for a hitchhiking-law reference. If it is ever revisited, link to official youth services rather than writing guidance.
- **Train-hopping content.** This was a major original forum (5,416 posts), and even the original forbade how-to content. It is high-risk and illegal trespass in most places, so skip it.
- **Re-creating "Vehicle Identification" pages** (8 states in 2002, content unknown). Purpose unclear; skip unless the original content is recovered.

---

## Suggested law-page data model (informed by the original layout)

The surviving original pages (BC, UK) followed this order:

1. Verdict
2. Official source heading
3. Definitions
4. Verbatim sections with numbers
5. Interpretation for hitchhikers
6. Local-ordinance caveat
7. (UK only) Driver-side rules

The current `US_UT.md` template already covers 1, 2, 4 and 5. Consider adding:

- `definitions:`: the statutory meaning of *roadway*, *shoulder*, *limited-access/controlled-access*, and *pedestrian*. Original pages leaned on these. For example, BC's "roadway" excludes the shoulder, which is why shoulder hitchhiking is lawful there.
- `driver_rules:`: whether drivers may stop or pick up on freeways (the UK page included this).
- `local_rules:` (item 5) and `history:` (item 2).
- `penalty:`: infraction, misdemeanour, fine range.
- `handout_summary:`: a ≤ 280-character line used verbatim on printable handouts (item 1).
