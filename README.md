# digihitch rebuild

A rebuild of **digihitch**, the hitchhiking portal that ran from 2001 to about 2010. Its most useful feature was a reference of the exact hitchhiking-related laws for every US state and Canadian province, with printable regional handouts. The original site went offline and was only partly recovered ([Hitchwiki/digihitch](https://github.com/Hitchwiki/digihitch)).

This repository starts with that law reference:

- **`resources/laws/`**: one Markdown file per jurisdiction (`<countryCode>_<stateCode>.md`, e.g. `US_UT.md`, `CA_ON.md`). Each file quotes the law verbatim, links to the official source, and explains in plain English what it means for a hitchhiker.
- **`site/`**: a static, dependency-free web page for GitHub Pages. It lists every jurisdiction, has a page for each one, and has printable handouts by region.
- **`resources/digihitch-original-site.md`**: what the original site contained and what was valuable.
- **`resources/future-features.md`**: the roadmap for later features.

## Law file format

`resources/laws/US_UT.md` is the reference template. Each file has YAML front matter:

```yaml
code: US_UT                      # must match the file name
country: US                      # US or CA
jurisdiction: Utah
abbreviation: UT
region: Mountain West            # see REGIONS in scripts/build-laws.mjs
status: legal                    # legal | restricted | illegal
freeway_pedestrians: prohibited  # prohibited | restricted | allowed | unclear
last_verified: 2026-11-02
key_citations:
  - "Utah Code § 41-6a-1009"
```

After the front matter come a `**Status:**` line and the sections `## Summary` and `## Laws`. Each law gets a `###` heading, a `**Source:**` link, a verbatim `>` quote, and a `**What it means:**` explanation. Optional sections are `## History`, `## Notable local rules`, and `## Unverified / open questions`. Every file ends with `## Sources`.

What the status values mean:

| Status | Meaning |
|---|---|
| `legal` | No statewide or provincial law specifically restricts soliciting rides. General pedestrian rules, such as freeway bans, may still apply. |
| `restricted` | Soliciting rides is only limited in certain places. The usual case: you may not stand *in the roadway*, but the shoulder or curb is fine. |
| `illegal` | Soliciting rides is prohibited broadly, for example anywhere on a highway including the shoulder. |

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

## Deploying to GitHub Pages

`.github/workflows/pages.yml` builds and validates the data on every push and pull request. Pushes to `main` also deploy. Enable it once under **Settings → Pages → Build and deployment → Source: GitHub Actions**.

`site/vendor/` contains pinned copies of [marked](https://github.com/markedjs/marked) 12.0.2 (MIT) and [DOMPurify](https://github.com/cure53/DOMPurify) 3.1.6 (Apache-2.0/MPL-2.0), which render the Markdown in the browser.

## Not legal advice

These files are research notes, not legal advice. Laws change, and cities, turnpike authorities and parks may have stricter rules. Always check the linked official source.
