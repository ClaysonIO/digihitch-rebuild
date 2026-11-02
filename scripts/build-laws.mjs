#!/usr/bin/env node
// Builds site/data/laws.json from resources/laws/*.md.
// Zero dependencies: parses the small YAML front-matter subset used by the law files
// and splits the Markdown body into its `## ` sections.
// Exits non-zero if any file is missing required fields or uses an invalid value.

import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const lawsDir = join(root, "resources", "laws");
const outFile = join(root, "site", "data", "laws.json");

export const REGIONS = [
  // [country, region] in display order
  ["US", "New England"],
  ["US", "Mid-Atlantic"],
  ["US", "Southeast"],
  ["US", "South Central"],
  ["US", "Great Lakes"],
  ["US", "Great Plains"],
  ["US", "Southwest"],
  ["US", "Mountain West"],
  ["US", "Pacific"],
  ["CA", "Atlantic Canada"],
  ["CA", "Central Canada"],
  ["CA", "Prairies"],
  ["CA", "Western Canada"],
  ["CA", "Northern Canada"],
];

const STATUS = ["legal", "restricted", "illegal", "unverified"];
const FREEWAY = ["prohibited", "restricted", "allowed", "unclear"];
const REQUIRED = [
  "code", "country", "jurisdiction", "abbreviation", "region",
  "status", "freeway_pedestrians", "last_verified", "key_citations",
];

function parseFrontMatter(text, file) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) throw new Error(`${file}: missing front matter`);
  const data = {};
  let listKey = null;
  for (const raw of m[1].split(/\r?\n/)) {
    // Strip trailing "# comments" unless the line holds a quoted value.
    const line = /["']/.test(raw) ? raw : raw.replace(/\s+#.*$/, "");
    if (!line.trim()) continue;
    const item = line.match(/^\s+-\s+(.*)$/);
    if (item && listKey) {
      data[listKey].push(unquote(item[1]));
      continue;
    }
    const kv = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (!kv) throw new Error(`${file}: cannot parse front matter line: ${raw}`);
    const [, key, value] = kv;
    if (value === "") {
      data[key] = [];
      listKey = key;
    } else {
      data[key] = unquote(value);
      listKey = null;
    }
  }
  return { data, body: text.slice(m[0].length) };
}

function unquote(v) {
  v = v.trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    return v.slice(1, -1);
  }
  return v;
}

function slug(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function splitSections(body) {
  const sections = {};
  let title = "";
  let statusLine = "";
  let current = "_intro";
  sections[current] = [];
  for (const line of body.split(/\r?\n/)) {
    const h1 = line.match(/^#\s+(.*)$/);
    const h2 = line.match(/^##\s+(.*)$/);
    if (h1 && !title) { title = h1[1].trim(); continue; }
    if (h2) { current = slug(h2[1]); sections[current] = []; continue; }
    if (current === "_intro" && !statusLine && /^\*\*Status:\*\*/.test(line)) {
      statusLine = line.replace(/^\*\*Status:\*\*\s*/, "").trim();
      continue;
    }
    sections[current].push(line);
  }
  for (const k of Object.keys(sections)) {
    sections[k] = sections[k].join("\n").trim();
    if (!sections[k]) delete sections[k];
  }
  return { title, statusLine, sections };
}

function build() {
  const errors = [];
  const entries = [];
  const regionNames = new Set(REGIONS.map(([, r]) => r));
  const files = readdirSync(lawsDir).filter((f) => /^[A-Z]{2}_[A-Z]{2}\.md$/.test(f)).sort();

  for (const file of files) {
    const text = readFileSync(join(lawsDir, file), "utf8");
    let fm;
    try { fm = parseFrontMatter(text, file); } catch (e) { errors.push(e.message); continue; }
    const d = fm.data;
    for (const k of REQUIRED) if (d[k] === undefined || d[k] === "") errors.push(`${file}: missing "${k}"`);
    if (d.code && `${d.code}.md` !== file) errors.push(`${file}: code "${d.code}" does not match file name`);
    if (d.country && !["US", "CA"].includes(d.country)) errors.push(`${file}: invalid country "${d.country}"`);
    if (d.status && !STATUS.includes(d.status)) errors.push(`${file}: invalid status "${d.status}"`);
    if (d.freeway_pedestrians && !FREEWAY.includes(d.freeway_pedestrians)) errors.push(`${file}: invalid freeway_pedestrians "${d.freeway_pedestrians}"`);
    if (d.region && !regionNames.has(d.region)) errors.push(`${file}: unknown region "${d.region}"`);
    if (d.key_citations && !Array.isArray(d.key_citations)) errors.push(`${file}: key_citations must be a list`);

    const { title, statusLine, sections } = splitSections(fm.body);
    if (!sections.laws) errors.push(`${file}: missing "## Laws" section`);
    if (!sections.sources) errors.push(`${file}: missing "## Sources" section`);
    if (!/\]\(https?:\/\//.test(fm.body)) errors.push(`${file}: no source links found`);

    entries.push({
      ...d,
      file: `resources/laws/${file}`,
      title,
      statusLine,
      sections,
    });
  }

  if (errors.length) {
    console.error(`Found ${errors.length} problem(s):\n  ` + errors.join("\n  "));
    process.exit(1);
  }

  const order = new Map(REGIONS.map(([, r], i) => [r, i]));
  entries.sort((a, b) => (order.get(a.region) - order.get(b.region)) || a.jurisdiction.localeCompare(b.jurisdiction));

  const out = {
    generated: new Date().toISOString(),
    regions: REGIONS.map(([country, name]) => ({ country, name, slug: slug(name) })),
    jurisdictions: entries,
  };
  mkdirSync(dirname(outFile), { recursive: true });
  writeFileSync(outFile, JSON.stringify(out, null, 1) + "\n");
  console.log(`Wrote ${entries.length} jurisdictions to ${outFile.replace(root + "/", "")}`);
}

build();
