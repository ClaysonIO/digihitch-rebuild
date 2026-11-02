# digihitch rebuild

A rebuild of **digihitch**, the hitchhiking portal that ran from 2001 to about 2010. Its most useful feature was a reference of the exact hitchhiking-related laws for every US state and Canadian province, with printable regional handouts. The original site went offline and was only partly recovered ([Hitchwiki/digihitch](https://github.com/Hitchwiki/digihitch)).

This repository starts with that law reference:

- **`resources/laws/`**: one Markdown file per jurisdiction (`<countryCode>_<stateCode>.md`, e.g. `US_UT.md`, `CA_ON.md`). Each file quotes the law verbatim, links to the official source, and explains in plain English what it means for a hitchhiker.
- **`site/`**: a static, dependency-free web page for GitHub Pages. It has a clickable map of the US and Canada coloured by legal status, a page for each jurisdiction, and pocket law cards. A pocket card is one double-sided sheet per region (or a custom route) that folds down to credit-card size, with the exact law text to show an officer.
- **`resources/digihitch-original-site.md`**: what the original site contained and what was valuable.
- **`resources/future-features.md`**: the roadmap for later features and research follow-ups.
- **`resources/verification-report.md`**: results of the automated check that quoted law text matches its linked source.

## Law file format

`resources/laws/US_UT.md` is the reference template. Each file has YAML front matter:

```yaml
code: US_UT                      # must match the file name
country: US                      # US or CA
jurisdiction: Utah
abbreviation: UT
region: Mountain West            # see REGIONS in scripts/build-laws.mjs
status: legal                    # legal | restricted | illegal_with_exceptions | illegal | unverified
freeway_pedestrians: prohibited  # prohibited | restricted | allowed | unclear
last_verified: 2026-11-02
key_citations:
  - "Utah Code § 41-6a-1009"
```

After the front matter come a `**Status:**` line and the sections `## Summary` and `## Laws`. Each law gets a `###` heading, a `**Source:**` link, a verbatim `>` quote, and a `**What it means:**` explanation. Optional sections are `## History`, `## Notable local rules`, and `## Unverified / open questions`. Every file ends with `## Sources`.

Each file also has a `## Pocket card` section just before `## Sources`, which feeds the printable pocket cards:

```markdown
## Pocket card

**What's allowed:** One or two plain sentences, 45 words at most.

> **Utah Code § 41-6a-1009(2), (7)**
> (2) Where a sidewalk is not provided, a pedestrian walking along or on a highway shall walk only on the shoulder, [...]
```

The build fails if any excerpt line isn't copied word for word from that file's own `## Laws` quotes (`[...]` marks an omission). It also fails if the excerpts add up to more than 200 words.

What the status values mean:

| Status | Meaning |
|---|---|
| `legal` | No statewide or provincial law specifically restricts soliciting rides. General pedestrian rules, such as freeway bans, may still apply. |
| `restricted` | Soliciting rides is only limited in certain places. The usual case: you may not stand *in the roadway*, but the shoulder or curb is fine. |
| `illegal_with_exceptions` | A broad ban that covers the shoulder too, but only on some roads (e.g. state-maintained ones) or with legal carve-outs (e.g. county exceptions). |
| `illegal` | Soliciting rides is prohibited broadly, for example anywhere on a highway including the shoulder. |
| `unverified` | The law text could not be retrieved and confirmed yet, so no conclusion is drawn. |

**Research rule: don't guess.** Every quote must come from a source you actually retrieved and linked, preferably the official legislature or government website. If something can't be verified, record it under `## Unverified / open questions`.

## Build and preview

The site reads `site/data/laws.json`, which `scripts/build-laws.mjs` generates from the Markdown files. The script needs Node 18+ and has no npm dependencies. It also validates the front matter and fails on bad values.

```bash
node scripts/build-laws.mjs
```

```bash
python3 -m http.server 8080 -d site
```

Then open <http://127.0.0.1:8080/>. Routes: `#/` (all laws), `#/law/US_UT`, `#/handouts`, `#/handout/mountain-west`, `#/about`.

Other scripts:

- `python3 scripts/verify-quotes.py` fetches every Source link and checks that each quoted passage appears in it word for word.
- `python3 scripts/build-map.py <natural-earth.geojson>` regenerates `site/data/map.json`, the pre-projected SVG map. Run it only to change the map geometry. The source is the [Natural Earth 1:50m admin-1](https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_50m_admin_1_states_provinces.geojson) file, which is public domain.

## Deploying to GitHub Pages

`.github/workflows/pages.yml` builds and validates the data on every push and pull request. Pushes to `main` also deploy. Enable it once under **Settings → Pages → Build and deployment → Source: GitHub Actions**.

`site/vendor/` contains pinned copies of [marked](https://github.com/markedjs/marked) 12.0.2 (MIT) and [DOMPurify](https://github.com/cure53/DOMPurify) 3.1.6 (Apache-2.0/MPL-2.0), which render the Markdown in the browser.

## Not legal advice

These files are research notes, not legal advice. Laws change, and cities, turnpike authorities and parks may have stricter rules. Always check the linked official source.
