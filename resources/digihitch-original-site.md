# digihitch.com: what the original site was

Research notes for the digihitch rebuild. Compiled 2026-11-02 from the Hitchwiki archive repository and a small amount of web searching.

**Evidence labels used below**

- **Confirmed (data):** read directly from the archive repo's JSON export of the July 2010 SQL dump.
- **Confirmed (repo text):** stated in the archive repo's README, CONTENT-NOTICE, scripts or `site/app.js`. This is secondary: the Hitchwiki maintainers wrote it, not the original operators.
- **Confirmed (web):** a third-party web page I actually fetched or saw in search results.
- **Inferred:** my interpretation of patterns in the data. Treat it as a hypothesis.
- **Unverified:** a claim from the project brief or elsewhere that I could not check.

**I could not view any Wayback Machine pages.** WebFetch refuses `web.archive.org`. One CDX query via curl was reset by the egress proxy. One `archive.org/wayback/available` request returned **HTTP 429**. I stopped there, as the brief and the archive README ask. Everything below about page layout therefore comes from the database export, not from rendered pages.

---

## 1. Summary

- digihitch.com was a **PHP-Nuke community portal with integrated phpBB forums**. It ran from **March 2001** (earliest dated entry 2001-03-13; "digihitch Launch and Upcoming Events" 2001-03-15) to at least **March 2010** (latest dated story 2010-03-21) (confirmed, data).
- Founder and main editor: **Morgan "Salman" Strub (Strüb)**, who died 28 March 2010 (confirmed, repo text + web).
- Content lived in **four story databases**: a global "main" section (`nuke`, 1,550 indexed stories), **USA** (`usa`, 562), **Europe** (`eu`, 151) and **Canada** (`can`, 140). That is 2,403 indexed stories in all (confirmed, data).
- Only the **Europe and Canada story bodies survive** (291 articles). For the USA and main sections, **only titles, authors and dates** survive. The forums survive only as **names and counts**: 65 boards, about 10,100 topics and 60,100 posts (confirmed, data).
- The **hitchhiking-laws resource** was a long-running core feature:
  - one story per US state (all 50, 2002–2004);
  - city ordinance pages (2007);
  - Canadian provinces (BC 2007; NB, ON, YT, AB, QC 2008);
  - the UK (2006).
  
  Only the **BC and UK law bodies survive**. Both follow the same layout: plain-language verdict, then verbatim statute text with section numbers, then an interpretation for hitchhikers, then a local-ordinance caveat (confirmed, data).
- **No evidence of printable "regional handouts"** exists in the dump. See §5.6.

---

## 2. History

| Fact | Evidence |
|---|---|
| Founded by Morgan Strub, known as "Salman". The name nods to Sal Paradise of Kerouac's *On the Road*. Slogan: "the site of subcultural movement." | Repo text (`site/app.js` `renderSalman()`). Search-result summary of Hitchwiki's User:Salman page: "webmaster and co-editor of digihitch.com". |
| First dated content: 2001-03-13, "Fatherly Advice from a Would-be Drifter" by Morgan. Then 2001-03-15, "digihitch Launch and Upcoming Events" by Salman. | Confirmed (data, `nav.json` xid 1 and xsid 4) |
| Site relaunch, "Meet the New digihitch": 2001-06-22 | Confirmed (data, title only) |
| Stories added per year (all sections): 2001: 69 · 2002: 158 · 2003: 234 · 2004: 364 · 2005: 378 · 2006: 282 · 2007: 370 · 2008: 271 · 2009: 213 · 2010: 64 (to 21 Mar) | Confirmed (data) |
| Salman wrote 465 indexed stories, plus 55 as "Morgan". Other prolific contributors: hikecrazy (148), dsmith4721 (66), highadventures (65), Macdonald (53), shoestring1989 (34), Lightfoot (29). There were 575 distinct author names. | Confirmed (data) |
| Salman died 28 March 2010 after an illness (a tumour, per the Hitchwiki profile summary). | Repo text (`app.js`), web search summary of hitchwiki.org/en/Salman |
| SQL dump date: 8 July 2010 (`salman_digihitch.sql.gz`, partial phpMyAdmin export) | Repo text (README) |
| Kevin Kelly's *Cool Tools* (2009-05-27) linked digihitch: "You can research more about current hitchhiking-related laws in the digihitch USA section." | Confirmed (web, fetched) |
| The forum was still being captured by Wayback in **Nov 2013** with a phpBB3 "prosilver" theme. The 2010 dump has phpBB2-style `nuke_bb*` tables, so the forum was probably migrated to standalone phpBB3 after 2010. | `scripts/fetch_branding.sh` uses Wayback timestamp `20131108033214` for `www.digihitch.com/styles/prosilver/...`. The migration is **inferred**. |
| When the site finally went offline | **Unknown.** I couldn't access Wayback. |

---

## 3. Platform and database (what the table names reveal)

Tables evidenced in `scripts/export_from_dump.py`, `scripts/verify_export.py` and the README:

| Table | What it held | Status in archive |
|---|---|---|
| `eu_stories` | Europe section stories (sid, title, aid/informant, hometext, bodytext, time, comments, counter = views, topic) | **Full bodies**, 151 rows |
| `can_stories` | Canada section stories, same schema | **Full bodies**, 140 rows |
| `anav_stories` | Cross-section navigation index. Fields: `xid`, `xsid` (story id in its own DB), `xtitle`, `xauthor`/`xuname`, `xdate`, `xcid` (country), `xhwy` (highway number), `xdest`, `xtags`, `xdb` (which story DB: `nuke`/`usa`/`eu`/`can`) | 2,403 rows, titles and metadata only |
| `anav_tags` | Tag vocabulary with stemming roots, synonyms (`tagalts`), blocked slurs (`tagnon`), related-tag links | 45 rows |
| `CountryTBL` | 213 countries with `latlong` and map `zoom` | 213 rows |
| `eu_region_hwy` | European E-road markers (E01–E99, E105, E115) with `descrip`, `img`, `rids` (region ids), `counter` | 98 rows, **all descriptions empty** |
| `nuke_bbforums` | phpBB forum list with topic and post counters | 65 rows |
| `nuke_bbposts` | Post metadata only (forum_id etc.) | 41,863 rows |
| `nuke_bbconfig` | phpBB config, including secrets. Deliberately **not** exported. | Present in dump, excluded |
| `nuke_bbposts_text`, `nuke_bbtopics`, `nuke_users` | Post bodies, topics, accounts | **Not in dump** |

Inferred:

- The `usa` and `nuke` story bodies would have lived in tables like `usa_stories` and `nuke_stories`. Those tables are not in the dump, or at least are not exported; the scripts never reference them.
- `xcid` uses a *different* country numbering from `CountryTBL`. All `usa` rows are 226 and all `can` rows are 38. Titles show 13=Australia, 73=France, 80=Germany, 138=Mexico, 225=UK and 232=Vietnam, which is an osCommerce-style ISO list. The rebuild should not join `xcid` to `CountryTBL.CountryID`.
- `xtags` is empty on every row. The tag system was either applied at query time by matching `tagroot`/`tagalts` against text, or never populated.
- `xhwy` is set on only 41 rows. The values are US route and Interstate numbers: 5, 10, 40, 80, 101, 290 and so on.

URL and asset clues seen in article HTML (confirmed, data):

- `ftopict-N-.html`: SEO-rewritten phpBB topic URLs.
- `images/gallery/albumN/…`: a photo gallery ("digipics").
- `images/articles/…` and `images/europe/…`.
- The forum descriptions mention `digihitch.com/surveys.html` for polls.
- Most other internal links were mangled during export (`href` becomes the bare Wayback root), so **original article URLs and the law-page URLs are not recoverable from the dump.**

---

## 4. Sections and content inventory

### 4.1 Section sizes (`anav_stories.xdb`)

| Section | Indexed stories | Bodies in archive | Date range | Notes |
|---|---|---|---|---|
| Main / global (`nuke`) | 1,550 | **0** | 2001-03 to 2010-03 | Front page news, world travel stories, features, reprints, site announcements, 2008 Canadian law pages |
| USA (`usa`) | 562 (highest sid 724, so about 160 deleted) | **0** | 2001 to 2008 (most 2002–2007) | State laws, city laws, truck stops, vehicle ID, state and route reports |
| Europe (`eu`) | 151 | **151** | 2003 to 2009 | Country trip reports, how-tos, UK law page |
| Canada (`can`) | 140 | **140** (24 are structured spot reports) | 2002 to 2009 | Province sections, spot guides, BC law page |

Main-section stories by country (inferred `xcid` mapping): USA 607, none or global 577, Canada 101, Mexico 44, UK 24, Australia 17, France 12, Vietnam 11, Germany 10, NZ 10. The USA tilt shows the "main" section was effectively a second US feed.

### 4.2 Article themes, with representative titles (titles from `nav.json`, grouped by me)

- **Trip reports and road stories** (the bulk): "Rocky Mountain Hitchhiking Journal, 2001"; "Hitchhiking across North Dakota"; "The Canada Chronicles - A Four-Year Hitchhiking Odyssey"; "Fare l'autostop in Italia - Hitchhiking in Italy"; "SD to Cape Horn, Argentina" (a 19+ part serial).
- **Route and spot reports**: "Hitchhiking I-80 Exit 173 near Mill Hall / Porter"; "Hitchhiking I-55 in Bolingbrook (Chicago)"; "Don't Get Dropped On Davenport On-Ramp!"; "Hitchhiking 400 North in Barrie". hikecrazy alone wrote dozens of "Hitchhiking <road> in <town>" posts in July 2005.
- **State and route guides**: "Legendary Rob - Hitchhiking Michigan/Vermont/New Hampshire/New York/Pennsylvania"; "United States Interstate System - from a hitchhiker perspective"; "I-10 Hitchhiking Ideas"; "Texas Road Conditions"; "BC Highways: Highway 97N: Cache Creek–Williams Lake".
- **Laws and police**: see §5. Also "Dealing with Arizona Cops", "Beware of the Oklahoma fascist police", "Experiences With Police [mainly RR Police]".
- **Truck stops and vehicle ID** (USA, 2002): "AL - Truck Stops (I-10/I-20/I-59/I-65/I-85)", "AR - Truck Stops (I-30/I-40/I-55)", "AZ - Truck Stops (I-8/I-10/I-40)", "Truck Stop mecca on I-75 south of Atlanta". Also "AL/AK/AZ/AR/CA/CO/CT/DE - Vehicle Identification" (8 states only; content unknown, probably plate or county-code decoding, **inferred**).
- **Train hopping / rail** (about 42 main titles): "Freight Train from Sioux City to Chicago's Proviso Yard", "Train Hopping from Tacoma to Portland". The forum rule was "How-To information is NOT acceptable".
- **Vagabonding, homelessness and runaways**: "A Night at the Rescue Mission", "Illegal to live in the forest", "Runaway Laws in Florida/Texas/California", "Excerpt from my book 'Memoirs of a Runaway'".
- **Gatherings, races and events**: "Hitchhikers Converge on Toronto for Gathering", "Hitchhiker Gathering Final, Toronto", "Hitchhiking competition 2003 Holland–Denmark", "European Cup of Hitch-hiking: from Moscow to Sicily and back", "The 4th International Hitch-Hiking Conference", hobo gatherings.
- **News reprints** (newspaper and wire stories, often marked "reprint"): "Hitchhiker struck by semi on Trans-Canada highway", "Ottawa metro area lawyer turns to hitchhiking during transit strike", "Carjacker Poses as Hitchhiker near Anchorage, Alaska".
- **Beat culture, books, poetry and music**: "Kerouac's 'On the Road' Hits the Highway", "Riding With Strangers - Elijah Wald…", "Books: Timbit Nation", "Hitchhiking Songs", "Far North, Far West – A Cross-country Haiku Journey".
- **Site features and announcements**: see §6.

### 4.3 Canada section structure (confirmed sub-sections; mapping inferred)

The Canada stories carry a numeric `topic` that matches provinces. can-26 also says "post them in the Alberta section of Digihitch Canada", which confirms provincial sections existed.

| topic | Inferred province or region | Count | Example |
|---|---|---|---|
| 2 | Rockies / desert (BC interior?) | 6 | "Canada has a desert" |
| 4 | Alberta | 10 | "Highway 2 in Alberta" |
| 5 | British Columbia | 32 | "Hitchhiking Laws in British Columbia (BC)" |
| 6 | Manitoba | 9 | "Hitchhiking Highway 75 South in Winnipeg" |
| 8 | New Brunswick | 2 | "From Sackville to Gagetown" |
| 9 | Newfoundland & Labrador | 5 | "Labrador or Bust" |
| 10 | (unclear) | 1 | "January Hitchhiker" |
| 12 | North (NWT/Nunavut) | 2 | "Hitchhiking Hwy 3 / Polar Bear Highway in Yellowknife" |
| 13 | Ontario | 30 | "Hitchhiking Highway 101 in Timmins" |
| 14 | PEI | 1 | "PEI Prince Edward Island" |
| 15 | Quebec | 6 | "Hitchhiking West out of Montréal" |
| 16 | Yukon | 7 | "Dawson City- Hitching the Border to Alaska" |
| 17 | Saskatchewan | 3 | "Hitchhiking Highway 11 (or 14) in Saskatoon" |
| 18 | Cross-Canada / general | 26 | "Kamloops B.C. to London Ontario" |

No topic was seen for Nova Scotia; it may simply have had no surviving stories.

### 4.4 Europe section structure (topics; region names inferred from titles)

| topic | Region | Count |
|---|---|---|
| 1 | Western/Central Europe (Benelux, DE, FR, CH, AT, ES) | 46 |
| 2 | UK & Ireland | 25 |
| 3 | Eastern Europe & Baltics | 17 |
| 4 | Scandinavia & Nordic | 15 |
| 5 | Southern Europe / Mediterranean | 14 |
| 6 | Russia | 4 |
| 7 | Balkans, Greece, Turkey | 6 |
| 8 | General / pan-European | 21 |
| 9 | Central (Austria, Poland) | 3 |

### 4.5 Spot guides (Canada, `spots.json`: 24 structured reports, 2004–2007)

The spot reports were generated from a **submission form**: each body is a fixed template of bold labels. I counted these labels across the 24 bodies (confirmed, data):

| Field | Present in | Example values |
|---|---|---|
| Lead line | all | "Hitchhiking resource for highway 144 in Sudbury with a rating of Average." |
| Heading "Hitchhiking in {town}" | most | |
| Nearby or related business/service | 13 | "Gas station", "Truckstop", "Esso", "Chateau Guay Motel and Restaurant" |
| Route / highway | 21 | "Highway 17 East", "400 north (highway)" |
| **Overall Rating** | 22 | Excellent / Good / Average / Poor |
| Hitchhiking Method | 18 | Gesture / Sign / Thumb |
| Using a sign that says | 7 | "Regina", "Either Sudbury or North Bay" |
| Location | 20 | "Sudbury" (sometimes linked) |
| Destination | 22 | "Timmins", "Victoria, BC" |
| Number of Hitchhikers | 17 | 1, 4 |
| Amount of Traffic | 20 | Average / Light |
| Waiting Time | 12 | 15–29 min / 30–60 min / > 60 min |
| Time of Day | 13 | Morning / Afternoon / Evening / Night |
| Type of Day | 13 | Weekday / Weekend |
| Weather Conditions | 12 | Sunny / Cloudy / Raining |
| Directions | 9 | Transit bus numbers, walk directions, where to stand |
| Extra Info | 8 | Free text |

Contributors: Salman, hikecrazy, Lightfoot, spareassannie. In the USA section, hikecrazy's 2005 "Hitchhiking I-80 Exit 432 near Omaha" titles look like the **same template used for US spots**. Their bodies are lost; this is **inferred**.

### 4.6 Maps

- `CountryTBL` gives every country a centre `latlong` and a `zoom` between 2 and 15. Canada is zoom 3, the USA zoom 3 and Germany zoom 5. These numbers fit Google Maps zoom levels, so this was a map-centering table (**inferred**).
- Forum descriptions explicitly reference a "**USA map**", "**Latin America map**", "**Middle East map**", "**Oceania map**" and Central/East/Southeast Asia regional pages (confirmed, data). Region-by-map browsing therefore existed. How it was built (Google Maps API or image maps) is unknown.

### 4.7 Highways (`highways.json`)

- 98 rows, one per European **E-road** (E01–E99, E105, E115). Every row has an empty `descrip`, a placeholder image `img/pix.gif`, an empty `rids` and `counter` 0. This looks like an **unfinished or stub "Europe by highway" feature** (inferred).
- US highway tagging existed through `anav_stories.xhwy` (41 rows; Interstates and US routes).

### 4.8 Tags (`tags.json`, 45 tags)

- Subculture-oriented: hitchhiking, train-hopping, hippie, punk, crusty-punk, backpacking, vagabonding, runaways, beat-culture, bohemian-culture, homeless, busking, spanging and panhandling, squatting, camping, cycling, motorbiking, bus-travel, lgbt, cops, highway/motorway/autobahn, walkabout.
- **Multilingual hitchhiking synonyms**: autostop, trampen/trempen, liftare, liftari, liften, thumbing.
- Each tag has a wildcard root (`hitchhik*`) and misspelling alternates. Some tags also carry `tagnon`, lists of blocked slurs.

### 4.9 Forums (`forums-meta.json`)

65 boards. Summed `forum_topics` = 10,097 and `forum_posts` = 60,117. The dump holds 41,863 post rows. Largest boards:

| Board | Topics | Posts |
|---|---|---|
| Hitchhikers Free-for-All | 774 | 8,298 |
| Sparkies (Novice/First-Time Hitchhikers) | 892 | 7,106 |
| USA – Sidekicks (Road Travel Partners) | 1,474 | 5,442 |
| Trains & Hopping | 566 | 5,416 |
| USA by State, Route or Hitchhiking Cross-Country | 852 | 4,189 |
| digihitch Article Discussion | 715 | 1,877 |
| Vagabond Techniques | 148 | 1,839 |
| Hitchhiking Tips & Techniques | 108 | 1,633 |
| Promote a Trip | 335 | 1,385 |
| Homelessness | 107 | 1,379 |
| Western Europe & Scandinavia | 283 | 1,216 |
| Travel Gear & General Trip Resources | 159 | 1,154 |
| Runaways | 111 | 1,115 |
| Extreme Hitchhiking | 52 | 1,011 |
| Hitchhiking Signs & Attention Methods | 61 | 987 |
| Canada – Sidekicks | 256 | 943 |
| Canada by Province, Route or Cross-Country | 211 | 925 |
| Europe Cross-Continent & Border Crossing | 170 | 903 |

Other notable boards:

- **CHECK IN!** (612 posts): "post your general plans… so we can help watch out for each other", a safety check-in.
- **Find Someone** (499).
- **USA/Canada – Work, Eat & Sleep Resources**.
- **Hitchhiker Gatherings & Happenings**.
- **Hitchhiker Races and Scavenger Hunt**.
- **Research and Road Teams**: "research and development of resources for hitchhikers, **including laws** and planned projects".
- **North America – Hitchhiker Road Team**: "the official forum for developing quality USA & CANADA resources for hitchhiking".
- **Road Bard Project** (private).
- **digihitch Improvement Team**.
- **Poll/Survey Discussion**.
- **Traveling with Pets**.
- Regional boards: UK & Ireland; Eastern Europe & Russia; Latin America & Caribbean; Middle East Asia & Africa; Australia & Oceania; Central and Far East Asia.

---

## 5. The laws section: how it worked

### 5.1 US state law pages (titles, authors and dates confirmed; bodies lost)

- **50 stories**, one per state, in the USA section (`xdb=usa`). The title format was exactly **`State Laws on Hitchhiking in {State Name} ({XX})`**. The original has a typo, "Lousiana", and an extra space in "California  (CA)".
- **No DC, Puerto Rico or other territories.**
- Authors: Salman 36, ontheroad 12, Morgan 1 (KS), elguero 1 (IL).

| Date | Author | States |
|---|---|---|
| 2002-09-06 | Salman | AL, AK, AR, CT, DE |
| 2002-09-10 → 09-19 | Salman | SC, FL, GA, OR, WA |
| 2002-11-08 → 11-09 | Salman | MT, NV, UT, WY, ND, SD, NM, TX, LA, MS |
| 2003-10-19 | Morgan | KS |
| 2004-02-19 | elguero | IL |
| 2004-04-03 → 04-04 | Salman / ontheroad | the remaining 30 (AZ, CA, CO, HI, ID, IN, IA, KY, ME, MD, MA, MI, MN, MO, NE, NH, NJ, NY, NC, OH, OK, PA, RI, TN, VT, VA, WV, WI) |

How these pages fit with the rest of the USA section:

- The first batch launched with a **state-by-state USA section**. Main-section announcement: "digihitch State by State" (2002-09-07). USA section: "Listing the USA, one state at a time..." (2002-09-10).
- The same days saw "{ST} - Vehicle Identification" and "{ST} - Truck Stops (I-nn)" entries for AL through DE.
- **Inferred:** each state was meant to get a bundle of Laws + Vehicle ID + Truck Stops by Interstate + stories. Only the laws were completed for all 50.
- The April 2004 batch is an alphabetical run of sids 320–368, with gaps where states already existed. This looks like a deliberate push to complete the 50-state set (inferred).
- In the 2002 batch, sid gaps (5, 7, 8) sit where AZ, CA and CO fall alphabetically. Those three were later re-created in 2004 (inferred).

### 5.2 Supporting US law articles (titles only)

- "Laws related to driving, hitchhiking and highways in the USA" (Salman, 2004-07-01)
- "A Primer on Hitchhiking Laws in the USA" (Salman, 2004-11-06)
- "Police say hitchhiking is illegal in Delaware..." (Salman, 2005-01-17)
- "Salt Lake City hitchhiking law" (GZeus, 2003-12-21)
- "Dealing with Arizona Cops" (2002)
- "Remember Your Rules" (2007)
- "The Hitchhiker Field Interview - Get a Report" (Salman, 2004-11-19). Possibly about police field-interview reports (inferred from title only).
- "Highway Report Card USA" (Salman, 2004-04-17)
- Runaway laws: "Web Researchers- Help Compile Runaway Laws" (2003-02-03, a crowd-research call); "Runaway Laws in Florida", "Texas Runaway Laws", "California Runaway Laws" (2005-06-13).

### 5.3 US city and municipal law pages (titles only, 2007)

The contributor **highadventures** posted 27 city-level pages between 2007-02-27 and 2007-04-27. Formats: "Hitchhiking Laws in {City}, {State}", "{City}, {ST} Laws", and multi-city pages.

Cities and areas covered:

- Hendersonville, Marion and Asheville NC
- Little Rock AR; Oklahoma City; Los Alamos County NM; Amarillo TX
- Augusta & Waterville ME; Claremont NH
- Lansing MI; Kansas City MO; Ottumwa IA; Kingsport TN; Shreveport LA; Vicksburg MS; Mobile AL
- Florence & Spartanburg SC; Savannah GA
- "Cities along I-95 in Florida"
- Omaha, North Platte & York NE
- Yankton, Brookings & Aberdeen SD
- Grand Forks ND
- Central Falls & West Warwick RI
- Charleston, Beckley & Hurricane WV
- Fall River, Medford, Newburyport, Peabody & Westfield MA
- Newark DE

### 5.4 Canadian province law pages

| Province | Title | Author / date | Section | Body |
|---|---|---|---|---|
| British Columbia | "Hitchhiking Laws in British Columbia (BC)" | Salman, 2007-12-24 | Canada (`can-149`, 126 views) | **Survives** |
| New Brunswick | "New Brunswick Hitchhiking Laws" | Salman, 2008-06-20 | Main (country = Canada) | Lost |
| Ontario | "Hitchhiking laws in Ontario, Canada" | Salman, 2008-06-20 | Main | Lost |
| Yukon | "Hitchhiking Laws in Yukon, Canada" | Salman, 2008-06-20 | Main | Lost |
| Alberta | "Hitchhiking Laws in Alberta, Canada" | Salman, 2008-06-22 | Main | Lost |
| Quebec | "Hitchhiking Laws in Quebec, Canada" | Salman, 2008-06-22 | Main | Lost |

- **No law pages were found** for Manitoba, Saskatchewan, Nova Scotia, PEI, Newfoundland & Labrador, NWT or Nunavut. Either they never existed or they weren't indexed in `anav_stories`.
- Related titles: "Hitchhiking in British Columbia and its laws" (Troy Watts, 2008); "Is it illegal to hitchhike in British Columbia? No, it is not illegal" (kipper, 2008); "Hitchhikers, Teamsters and Bad Law" (Macdonald, 2004); "Rules of Thumb: A Hitchhiker's Guide to the Sea to Sky" (Pique newsmagazine reprint, 2008).
- Outside North America: "**Hitchhiking Laws in the UK for England, Wales, Scotland, Northern Ireland**" (Salman, 2006-07-14, `eu-97`, **1,133 views**, body survives).

### 5.5 Page layout (confirmed from the two surviving bodies)

PHP-Nuke stories have a `hometext` (intro shown on index pages) and a `bodytext` ("read more"). Both law pages use them the same way:

1. **Verdict lead** (hometext): a one-paragraph plain-English answer, then caveats, then "Read more below."
   - BC: "…hitchhiking is generally legal if following the basic law of not standing in the middle of the road. … all laws prohibiting a pedestrian … from a certain highway … supercede this law (such as on a controlled access road like the TransCanada highway)."
   - UK: "While no specific mention of the act of hitchhiking could be found in UK law…", followed by a bullet list of what applies.
2. **Source heading**: the official compilation and act name in bold. Example: "Revised Statutes and Consolidated Regulations of British Columbia / **Motor Vehicle Act** [RSBC 1996] CHAPTER 318 / Part 3".
3. **Definitions**: the statutory definitions that matter, such as "pedestrian" and "roadway". The BC page notes that "roadway" excludes the shoulder.
4. **Verbatim statute text** with section and subsection numbers, e.g. "**182** (1)… (2)… (3) A person must not be on a roadway to solicit a ride… (4) Except for a person who solicits a ride in an emergency situation…". The UK page quotes Highway Code rules with their legal citations (e.g. "Laws RTRA sect 17, MT(E&W)R 1982…").
5. **Interpretation for hitchhikers**, e.g. "It is numbers (3) and (4) above that apply to hitchhikers… as long as you do not enter highways/roads that prohibit pedestrians and stay off the section of a road that is for driving, you are technically allowed to hitchhike throughout BC."
6. **Practical and local caveat**: "There are some cities or towns that have their own laws… stick to roads or highway entrances that are on the edge of urban or suburban areas." The UK page advises "use motorway entrances or hitchhike from service areas".
7. **Driver-side rules** (UK only): Highway Code 244/245, which say drivers must not stop on, or pick up anyone on, a motorway.

What the pages lacked:

- No structured fields: no status enum, no "last verified" date, no penalty field.
- Links to official sources were inline anchors. Their URLs were lost in the export.

The rebuild's `resources/laws/US_UT.md` template is a superset of this layout:

- status
- summary
- quoted law, each with a "What it means" note
- history
- sources
- disclaimer

### 5.6 Regional grouping and printable handouts: **not evidenced**

- The archive has **no title, tag, table or body text** mentioning "handout", "printable", "print version" or "PDF" for laws.
- Grouping in the data is **one page per state or province**, filed under the country section. Canada also had per-province story sections (§4.3).
- **I found no US regional grouping** such as "Pacific Northwest" or "New England" anywhere in the dump.
- The brief's statement that the old site had "printable regional handouts" is therefore **unverified**. It may be true of the live site: PHP-Nuke had a built-in "Printer Friendly Page" link on every story, and the site may have had static pages outside the CMS tables. But only Wayback captures of the USA section could confirm it, and I couldn't reach them.

Adjacent clues (titles only):

- "Hitchhiking Culture Jam: Our feet, your flyers" (Salman, 2003-12-15): a flyer campaign of some kind.
- "Highway Report Card USA" (2004).
- The Research/Road Team forums, which were about developing law resources.

**To verify manually** (in a browser, not with a script):

- Wayback captures of `digihitch.com/` from 2004–2009.
- The USA section index.
- Any `modules.php?name=…` URL containing "law".
- The CDX listing `web.archive.org/cdx/search/cdx?url=digihitch.com/*&filter=urlkey:.*law.*&collapse=urlkey`.

---

## 6. Other features (from announcement titles in the main section)

All of the following are **titles only**; descriptions are inferred from the titles.

| Feature | Date | Evidence title |
|---|---|---|
| "digipics" photo gallery of road images | 2001-07 | "Photo Gallery of Road Images- digipics"; `images/gallery/albumN/` URLs |
| Giveaways and anniversary giveaways | 2001, 2004 | "The Great digihitch Giveaway", "3rd Anniversary Giveaway!" |
| Sponsorship: expeditions and hitchhiking research | 2001, 2004 | "Sponsor a Hitchhiking Expedition…", "Unearthing Road History- Sponsor Hitchhiking Research" |
| encycloPEDia (road and hitchhiking glossary or encyclopedia) | 2002-05 | "New Feature: encycloPEDia" |
| eCards | 2002-07 | "New Feature- eCards" |
| State-by-state USA resources | 2002-09 | "digihitch State by State" |
| Hitchhiker interviews ("Forks & Features") | 2003-03 | "New Hitchhiker Interview in Forks & Features" |
| Song Lyrics Encyclopedia | 2004-01 | "New Feature - Song Lyrics Encyclopedia" |
| Press list | 2004-01 | "digihitch in the News- the full list" |
| Road Reviews | 2004-03 | "New Road Reviews on digihitch" |
| Highway Report Card USA | 2004-04 | title |
| Member discounts at a hostel in Mexico | 2004-04 | title |
| Hitchhiker Gathering(s) and Scavenger Hunt | 2003–2005 | forum descriptions; "Hitchhikers Converge on Toronto for Gathering" |
| Polls and surveys | ? | `digihitch.com/surveys.html` (forum description) |
| Article comments via forum threads | ? | Forum "digihitch Article Discussion" plus per-section discussion boards |

---

## 7. What was lost

- **All USA-section bodies (562)**, including the **50 state law pages**, the 27 city law pages, truck stops and vehicle ID.
- **All main-section bodies (1,550)**, including the 2008 law pages for NB, ON, YT, AB and QC.
- **All forum content**: about 60k posts of tips, travel-partner requests and regional Q&A. Only board names and counts remain.
- **Images**. They are referenced by Wayback URL only, and `banner.png` is committed.
- Gallery, encycloPEDia, song lyrics, eCards, polls and user accounts.
- Most internal link targets, including the law pages' links to official statute sources.

---

## 8. What was most valuable to users (evidence)

1. **Practical, location-specific road information.** The most-viewed archived articles are mostly country, route and spot guides:
   - #1 "Fare l'autostop in Italia – Hitchhiking in Italy": 15,123 views
   - #2 "Spain: Hitchhiking Barcelona to Granada": 8,807
   - #4 "Hitchhiking Europe": 5,468
   - #11 "Best and Worst Hitching Spots in the UK": 2,406
   - #15 "Hitchhiking the Transcanadian Highway West from Ottawa", a spot report: 2,065
   - #20 "Border Crossing at Niagara Falls": 1,915
2. **The legal question "is it legal here?"**
   - Every state was covered for 8 years.
   - Volunteers extended it down to city ordinances.
   - The UK laws page drew 1,133 views.
   - Kevin Kelly's 2009 review pointed readers specifically to the USA section's law research.
   - Two forums were dedicated to researching law resources.
3. **Community and peer help.** The biggest forums were the general board, the **novice "Sparkies"** board and **travel-partner "Sidekicks"** boards (USA Sidekicks had the most topics of any board: 1,474). Next came **Trains & Hopping** and **USA by State/Route**.
4. **Safety.** The CHECK IN! board, Find Someone, Extreme Hitchhiking, and news on hitchhiker deaths and crimes.
5. **Culture and identity.** Stories, Beat literature, gatherings and races, reprints. Total archived Europe/Canada views were about 251k.

---

## 9. Licensing and reuse (important)

- Archive **code** is MIT. Archived **article text and images are NOT MIT**. Rights remain with the original authors and rightsholders (`CONTENT-NOTICE.md`, README).
- **We cannot republish** archived article text, spot report text, the BC or UK law-page prose, or images without permission from the authors. Many are pseudonymous (Salman's estate, hikecrazy, Lightfoot, etc.).
- **News reprints** ("Reprinted from the Edmonton Journal / Globe and Mail / Ottawa Citizen / Ananova") are third-party copyrighted material. Do not reuse them even with a contributor's permission.
- **Statute text itself** (e.g. BC Motor Vehicle Act s.182, US state codes) is generally reusable from official sources. US state law is public domain under *Georgia v. Public.Resource.Org* (2020), but annotations are not. **Re-source statutes from official current sources.** Never copy them from the 2002–2008 pages: they are 15–20+ years out of date. Utah, for example, removed "soliciting rides" from § 41-6a-1009 in 2017.
- Canadian statutes are under Crown copyright. Federal law may be reproduced under the Reproduction of Federal Law Order. Each province and territory sets its own reproduction terms, so check them before quoting provincial statutes at length.
- **Facts and metadata** are generally fine to use as research leads. That covers titles, dates, the list of which states or cities had pages, and spot ratings as data points. Re-verify any facts before publishing.
- **Privacy**: the archive strips emails, and the content may name real people. Honour the takedown process if importing anything.
- Do **not** bulk-fetch Wayback (archive README policy). Any asset retrieval should be manual.

---

## 10. Sources

Archive repository: [github.com/Hitchwiki/digihitch](https://github.com/Hitchwiki/digihitch), local clone, HEAD `4242060`

- `README.md`, `CONTENT-NOTICE.md`
- `scripts/export_from_dump.py`: table names and spot-field parser
- `scripts/sql_dump_parser.py`, `scripts/verify_export.py` (shows `nuke_bbconfig` existed), `scripts/fetch_branding.sh` (Nov 2013 forum capture)
- `site/app.js`: routes `#/articles`, `#/spots`, `#/forum`, `#/about`, `#/salman`; Salman biography
- `site/data/manifest.json`, `nav.json`, `spots.json`, `countries.json`, `highways.json`, `tags.json`, `forums-meta.json`, `search-index.json`
- `site/data/articles/can-149.json` (BC laws), `eu-97.json` (UK laws), `can-26.json` ("Alberta section of Digihitch Canada")

Web:

- Kevin Kelly, *Cool Tools*, "Living on the Road", 2009-05-27: <https://kk.org/cooltools/?p=3743> (fetched)
- Hitchwiki User:Salman: <https://hitchwiki.org/en/Salman>. **Not fetched** (Anubis bot wall); seen only as a web-search summary.
- Hitchwiki Digihitch: <https://hitchwiki.org/en/Digihitch>. Not fetched, per the brief.
- Elijah Wald, Hitchhiking quotations: <https://elijahwald.com/hitchquotes.html>. Fetch hit a verification wall; a search summary says it recommends digihitch.

Wayback Machine: **no pages viewed** (connection reset and HTTP 429). Starting points for manual browser checks:

- <https://web.archive.org/web/*/http://digihitch.com/>
- <https://web.archive.org/web/*/digihitch.com/*law*>
