/* digihitch rebuild: hitchhiking laws SPA. Data comes from data/laws.json (built from resources/laws/*.md). */
(function () {
  "use strict";

  const REPO = "https://github.com/ClaysonIO/digihitch-rebuild";
  const main = document.getElementById("main");
  const STATUS_TEXT = {
    legal: "Legal",
    restricted: "Restricted",
    illegal_with_exceptions: "Illegal with exceptions",
    illegal: "Illegal",
    unverified: "Unverified",
  };
  const STATUS_HELP = {
    legal: "No statewide/provincial law specifically restricts soliciting rides. General pedestrian rules (like freeway bans) still apply.",
    restricted: "Soliciting rides is limited to certain places or ways. Usually you can't stand in the roadway itself, but the shoulder or curb is fine.",
    illegal_with_exceptions: "A broad ban covers the shoulder too, but only on some roads (e.g. state-maintained ones) or with legal carve-outs (e.g. county exceptions).",
    illegal: "Soliciting rides is prohibited broadly, for example anywhere on a highway including the shoulder.",
    unverified: "We couldn't retrieve and confirm the law text yet. No conclusion is drawn.",
  };
  const FREEWAY_TEXT = {
    prohibited: "Pedestrians prohibited on freeways",
    restricted: "Freeway pedestrian limits",
    allowed: "No freeway pedestrian ban found",
    unclear: "Freeway rules unclear",
  };
  const COUNTRY = { US: "United States", CA: "Canada" };

  let DATA = null;
  const state = { q: "", country: "all", status: "all" };

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function md(src) {
    const html = window.marked.parse(src || "", { gfm: true, breaks: false });
    const clean = window.DOMPurify.sanitize(html);
    const tpl = document.createElement("template");
    tpl.innerHTML = clean;
    // Tag plain-English explanation paragraphs so handouts can hide them.
    tpl.content.querySelectorAll("p").forEach((p) => {
      const first = p.firstElementChild;
      if (first && first.tagName === "STRONG" && /^What it means/i.test(first.textContent) && p.firstChild === first) {
        p.classList.add("explain");
      }
    });
    tpl.content.querySelectorAll("a[href^='http']").forEach((a) => {
      a.target = "_blank";
      a.rel = "noopener";
    });
    return tpl;
  }

  function pill(status) {
    return `<span class="pill ${esc(status)}">${esc(STATUS_TEXT[status] || status)}</span>`;
  }

  function setActiveNav(name) {
    document.querySelectorAll(".site-nav a").forEach((a) => a.classList.toggle("active", a.dataset.nav === name));
  }

  function setTitle(t) {
    document.title = t ? `${t} — digihitch` : "digihitch — Hitchhiking Laws";
  }

  function statusesInUse() {
    return Object.keys(STATUS_TEXT).filter((s) => s !== "unverified" || DATA.jurisdictions.some((j) => j.status === s));
  }

  function byCode(code) {
    return DATA.jurisdictions.find((j) => j.code === code);
  }

  /* ---------- Home ---------- */
  let MAP = null;
  const mapReady = fetch("data/map.json").then((r) => (r.ok ? r.json() : null)).then((m) => (MAP = m)).catch(() => null);

  function renderHome() {
    setActiveNav("home");
    setTitle("");
    main.innerHTML = `
      <section class="hero">
        <h1>Hitchhiking laws for every US state and Canadian province</h1>
        <p>The exact statute text, a link to the official source, and a plain-English explanation of what it means for you on the roadside. Click a state or province on the map.</p>
      </section>
      <section class="map-card" aria-label="Map of hitchhiking law status">
        <div class="legend-bar" role="group" aria-label="Filter by status"></div>
        <div class="map-wrap"><div class="map-loading">Loading map…</div></div>
        <div class="map-tip" role="status" aria-live="polite" hidden></div>
      </section>
      <details class="no-print legend-details">
        <summary>What do the labels mean?</summary>
        <div class="legend">
          ${statusesInUse().map((s) => `<div>${pill(s)}<br>${esc(STATUS_HELP[s])}</div>`).join("")}
        </div>
      </details>
      <div class="controls" role="search">
        <input type="search" id="q" placeholder="Search by state, province, or statute…" aria-label="Search" value="${esc(state.q)}">
        <div class="seg" role="group" aria-label="Country">
          ${[["all", "All"], ["US", "USA"], ["CA", "Canada"]].map(([v, l]) => `<button type="button" data-country="${v}" aria-pressed="${state.country === v}">${l}</button>`).join("")}
        </div>
        <select id="status" aria-label="Status">
          <option value="all">Any status</option>
          ${statusesInUse().map((s) => `<option value="${s}" ${state.status === s ? "selected" : ""}>${STATUS_TEXT[s]}</option>`).join("")}
        </select>
      </div>
      <div id="results"></div>`;

    const q = main.querySelector("#q");
    q.addEventListener("input", () => { state.q = q.value; update(); });
    main.querySelectorAll("[data-country]").forEach((b) => b.addEventListener("click", () => {
      state.country = b.dataset.country;
      main.querySelectorAll("[data-country]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      update();
    }));
    main.querySelector("#status").addEventListener("change", (e) => { state.status = e.target.value; update(); });
    renderLegendBar();
    mapReady.then(() => { if (main.querySelector(".map-wrap")) renderMap(); });
    renderResults();
  }

  function update() {
    renderResults();
    renderLegendBar();
    paintMap();
  }

  function renderLegendBar() {
    const bar = main.querySelector(".legend-bar");
    if (!bar) return;
    const all = DATA.jurisdictions;
    bar.innerHTML = statusesInUse().map((s) => {
      const n = all.filter((j) => j.status === s).length;
      return `<button type="button" class="legend-btn" data-status="${s}" aria-pressed="${state.status === s}" title="${esc(STATUS_HELP[s])}">
        <span class="swatch ${s}"></span>${esc(STATUS_TEXT[s])}<span class="count">${n}</span></button>`;
    }).join("");
    bar.querySelectorAll(".legend-btn").forEach((b) => b.addEventListener("click", () => {
      state.status = state.status === b.dataset.status ? "all" : b.dataset.status;
      const sel = main.querySelector("#status");
      if (sel) sel.value = state.status;
      update();
    }));
  }

  function renderMap() {
    const wrap = main.querySelector(".map-wrap");
    if (!MAP) { wrap.innerHTML = `<p class="map-loading">Map unavailable.</p>`; return; }
    const chipW = 46, chipH = 24;
    const maxChipX = Math.max(...MAP.chips.map((c) => c.x + chipW));
    const vbW = Math.max(MAP.width, maxChipX + 8);
    const hi = MAP.hawaiiInset;
    const lab = new Map(MAP.labels.map((l) => [l.code, l]));
    const name = (code) => (byCode(code) || {}).jurisdiction || code;
    const parts = [];
    parts.push(`<rect class="inset" x="${hi.x}" y="${hi.y}" width="${hi.w}" height="${hi.h}" rx="6"></rect>`);
    for (const sh of MAP.shapes) {
      parts.push(`<a href="#/law/${sh.code}" class="region-link" data-code="${sh.code}" aria-label="${esc(name(sh.code))}"><path d="${sh.d}"></path></a>`);
    }
    for (const c of MAP.chips) {
      parts.push(`<line class="leader" x1="${c.tx}" y1="${c.ty}" x2="${c.x}" y2="${c.y + chipH / 2}"></line>`);
    }
    for (const c of MAP.chips) {
      const abbr = c.code.split("_")[1];
      parts.push(`<a href="#/law/${c.code}" class="region-link chip" data-code="${c.code}" aria-label="${esc(name(c.code))}">
        <rect x="${c.x}" y="${c.y}" width="${chipW}" height="${chipH}" rx="5"></rect>
        <text x="${c.x + chipW / 2}" y="${c.y + chipH / 2 + 1}">${abbr}</text></a>`);
    }
    for (const l of MAP.labels) {
      if (!l.show) continue;
      parts.push(`<text class="map-label" data-code="${l.code}" x="${l.x}" y="${l.y}">${l.code.split("_")[1]}</text>`);
    }
    wrap.innerHTML = `<svg class="map" viewBox="0 0 ${vbW} ${MAP.height}" role="img" aria-label="Map of the United States and Canada colored by hitchhiking law status">${parts.join("")}</svg>`;
    const tip = main.querySelector(".map-tip");
    const show = (code, ev) => {
      const j = byCode(code);
      if (!j) return;
      tip.innerHTML = `<strong>${esc(j.jurisdiction)}</strong> ${pill(j.status)}<div>${esc(FREEWAY_TEXT[j.freeway_pedestrians] || "")}</div>`;
      tip.hidden = false;
      const r = main.querySelector(".map-card").getBoundingClientRect();
      if (ev && ev.clientX) {
        const x = Math.min(ev.clientX - r.left + 14, r.width - 230);
        tip.style.left = Math.max(8, x) + "px";
        tip.style.top = (ev.clientY - r.top + 14) + "px";
      } else {
        tip.style.left = "12px"; tip.style.top = "12px";
      }
    };
    wrap.querySelectorAll(".region-link").forEach((a) => {
      a.addEventListener("mousemove", (e) => show(a.dataset.code, e));
      a.addEventListener("focus", () => show(a.dataset.code));
      a.addEventListener("mouseleave", () => { tip.hidden = true; });
      a.addEventListener("blur", () => { tip.hidden = true; });
    });
    paintMap();
  }

  function paintMap() {
    const svg = main.querySelector("svg.map");
    if (!svg) return;
    svg.querySelectorAll(".region-link").forEach((a) => {
      const j = byCode(a.dataset.code);
      const st = j ? j.status : "none";
      a.setAttribute("class", `region-link ${a.classList.contains("chip") ? "chip " : ""}st-${st}${j && matches(j) ? "" : " dim"}`);
    });
  }

  function matches(j) {
    if (state.country !== "all" && j.country !== state.country) return false;
    if (state.status !== "all" && j.status !== state.status) return false;
    const q = state.q.trim().toLowerCase();
    if (!q) return true;
    const hay = [j.jurisdiction, j.abbreviation, j.code, j.region, ...(j.key_citations || [])].join(" ").toLowerCase();
    return hay.includes(q);
  }

  function renderResults() {
    const out = main.querySelector("#results");
    const list = DATA.jurisdictions.filter(matches);
    if (!list.length) { out.innerHTML = `<p class="empty">No matches.</p>`; return; }
    out.innerHTML = DATA.regions.map((r) => {
      const items = list.filter((j) => j.region === r.name);
      if (!items.length) return "";
      return `
        <section class="region">
          <div class="region-head">
            <h2>${esc(r.name)}<span class="country">${esc(COUNTRY[r.country])}</span></h2>
            <a href="#/handout/${esc(r.slug)}">Pocket law card →</a>
          </div>
          <div class="grid">
            ${items.map((j) => `
              <a class="card" href="#/law/${esc(j.code)}">
                <span class="abbr ${esc(j.status)}">${esc(j.abbreviation)}</span>
                <span class="name">${esc(j.jurisdiction)}</span>
                <span class="meta">${pill(j.status)}<span>${esc((j.key_citations || [])[0] || "")}</span></span>
              </a>`).join("")}
          </div>
        </section>`;
    }).join("");
  }

  /* ---------- Jurisdiction ---------- */
  function renderLaw(code) {
    const j = byCode(code);
    if (!j) return renderNotFound();
    setActiveNav("home");
    setTitle(`${j.jurisdiction} hitchhiking laws`);
    const region = DATA.regions.find((r) => r.name === j.region);
    const order = ["summary", "laws", "history", "notable-local-rules", "unverified-open-questions", "sources"];
    const keys = Object.keys(j.sections).filter((k) => k !== "_intro" && k !== "pocket-card");
    keys.sort((a, b) => (order.indexOf(a) + 1 || 99) - (order.indexOf(b) + 1 || 99));
    const titles = {
      summary: "Summary", laws: "Laws", history: "History", "notable-local-rules": "Notable local rules",
      "unverified-open-questions": "Unverified / open questions", sources: "Sources",
    };
    const body = (j.sections._intro ? j.sections._intro + "\n\n" : "") +
      keys.map((k) => `## ${titles[k] || k.replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase())}\n\n${j.sections[k]}`).join("\n\n");

    main.innerHTML = `
      <nav class="crumbs" aria-label="Breadcrumb"><a href="#/">All laws</a> › ${esc(COUNTRY[j.country])} › ${esc(j.region)}</nav>
      <div class="law-head">
        <div>
          <h1>${esc(j.jurisdiction)}</h1>
          <div class="facts">${pill(j.status)}<span>${esc(FREEWAY_TEXT[j.freeway_pedestrians] || "")}</span><span class="sep">•</span><span>Last verified ${esc(j.last_verified)}</span></div>
        </div>
        <div class="actions">
          <a class="btn primary" href="#/handout/custom/${esc(j.code)}">Pocket card</a>
          <button class="btn" type="button" onclick="window.print()">Print page</button>
          <a class="btn" href="${REPO}/blob/main/${esc(j.file)}" target="_blank" rel="noopener">View source file</a>
          <a class="btn" href="${REPO}/issues/new?title=${encodeURIComponent("Correction: " + j.jurisdiction)}" target="_blank" rel="noopener">Report a correction</a>
        </div>
      </div>
      ${j.statusLine ? `<div class="status-line ${esc(j.status)}"></div>` : ""}
      <article class="prose" id="law-body"></article>`;
    if (j.statusLine) {
      const sl = main.querySelector(".status-line");
      sl.append(md(j.statusLine).content);
    }
    main.querySelector("#law-body").append(md(body).content);
    window.scrollTo(0, 0);
  }

  /* ---------- Pocket handouts ----------
     One US Letter sheet, landscape, double-sided: a 3 x 4 grid of 3.5" x 2" panels per side.
     Folded like a road map it becomes a credit-card-sized packet. Every panel stands alone
     (jurisdiction name on each), so you can show an officer just the panel they need. */
  const SITE_URL = () => (location.origin + location.pathname).replace(/^https?:\/\//, "").replace(/\/(index\.html)?$/, "");
  const PANELS_PER_SIDE = 12;
  const POCKET_PAGE_CSS = "@page { size: letter landscape; margin: 0.25in; }";

  function renderHandouts() {
    setActiveNav("handouts");
    setTitle("Pocket law cards");
    main.innerHTML = `
      <section class="hero">
        <h1>Pocket law cards</h1>
        <p>One double-sided sheet per region that folds down to credit-card size. For each state or province it gives a one-line summary of what's allowed and the exact law text, with section numbers. If an officer thinks hitchhiking is illegal, show them the panel for where you are, so they can check the specific law.</p>
      </section>
      <h2>United States</h2>
      <div class="handout-list">${handoutLinks("US")}</div>
      <h2>Canada</h2>
      <div class="handout-list">${handoutLinks("CA")}</div>
      <h2>Build your own (e.g. for a route)</h2>
      <form class="custom-pick" id="pick">
        ${["US", "CA"].map((c) => `<fieldset><legend>${COUNTRY[c]}</legend>${DATA.jurisdictions.filter((j) => j.country === c)
          .slice().sort((a, b) => a.jurisdiction.localeCompare(b.jurisdiction))
          .map((j) => `<label><input type="checkbox" value="${esc(j.code)}"> ${esc(j.jurisdiction)}</label>`).join("")}</fieldset>`).join("")}
        <button class="btn primary" type="submit">Make my card</button>
      </form>`;
    main.querySelector("#pick").addEventListener("submit", (e) => {
      e.preventDefault();
      const codes = [...e.target.querySelectorAll("input:checked")].map((i) => i.value);
      if (codes.length) location.hash = `#/handout/custom/${codes.join(",")}`;
    });
  }

  function handoutLinks(country) {
    return DATA.regions.filter((r) => r.country === country).map((r) => {
      const js = DATA.jurisdictions.filter((j) => j.region === r.name);
      if (!js.length) return "";
      return `<a href="#/handout/${esc(r.slug)}"><div class="hl-name">${esc(r.name)}</div><div class="hl-sub">${js.map((j) => esc(j.abbreviation)).join(" · ")}</div></a>`;
    }).join("");
  }

  function renderHandout(slug, extra) {
    let title, js;
    if (slug === "custom") {
      const codes = (extra || "").split(",").map((c) => c.trim().toUpperCase()).filter(Boolean);
      js = codes.map(byCode).filter(Boolean);
      title = js.length === 1 ? js[0].jurisdiction : "My route";
    } else {
      const r = DATA.regions.find((x) => x.slug === slug);
      if (!r) return renderNotFound();
      js = DATA.jurisdictions.filter((j) => j.region === r.name);
      title = r.name;
    }
    if (!js.length) return renderNotFound();
    setActiveNav("handouts");
    setTitle(`${title} pocket law card`);
    main.innerHTML = `
      <nav class="crumbs"><a href="#/handouts">Pocket law cards</a> › ${esc(title)}</nav>
      <div class="handout-toolbar">
        <button class="btn primary" type="button" onclick="window.print()">Print</button>
        <ol class="howto">
          <li><strong>Print double-sided</strong> on US Letter, landscape, <em>flip on short edge</em>, at <strong>100% / actual size</strong> (not "fit to page").</li>
          <li><strong>Fold along the horizontal lines</strong> back and forth like an accordion, giving a long strip.</li>
          <li><strong>Fold the strip</strong> back and forth along the vertical lines. The cover ends up on top, about the size of a credit card.</li>
        </ol>
      </div>
      <div class="pocket-preview" id="pocket"></div>`;
    buildPocketSheets(main.querySelector("#pocket"), title, js);
    window.scrollTo(0, 0);
  }

  // Ensure landscape @page only while a pocket card is on screen.
  function setPocketPageStyle(on) {
    let el = document.getElementById("pocket-page-style");
    if (on && !el) {
      el = document.createElement("style");
      el.id = "pocket-page-style";
      el.textContent = POCKET_PAGE_CSS;
      document.head.append(el);
    } else if (!on && el) el.remove();
  }

  function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  function panelShell(name, status, tag) {
    const p = el("div", "pc-panel");
    p.append(el("div", "pc-head",
      `<span class="pc-name">${esc(name)}</span>${status ? `<span class="pc-status">${esc(STATUS_TEXT[status] || status)}</span>` : ""}${tag ? `<span class="pc-tag">${esc(tag)}</span>` : ""}`));
    p.append(el("div", "pc-body"));
    return p;
  }

  // 2px safety margin so print rasterisation never clips the last line.
  const overflows = (panel) => {
    const b = panel.querySelector(".pc-body");
    const last = b.lastElementChild;
    if (!last) return false;
    const bottom = last.getBoundingClientRect().bottom - b.getBoundingClientRect().top;
    return bottom > b.clientHeight - 2;
  };

  // Flow a list of block elements into as many panels as needed (measured in a hidden sheet-sized box).
  function flowPanels(measure, makePanel, blocks) {
    const panels = [];
    let cur = makePanel(); measure.append(cur); panels.push(cur);
    const queue = blocks.slice();
    while (queue.length) {
      const b = queue.shift();
      const body = cur.querySelector(".pc-body");
      body.append(b);
      if (!overflows(cur)) continue;
      b.remove();
      if (body.children.length) {
        // If the last thing on this panel is a citation heading, carry it to the next panel too.
        const last = body.lastElementChild;
        const carry = last && last.classList.contains("pc-cite") ? [last] : [];
        carry.forEach((c) => c.remove());
        cur = makePanel(); measure.append(cur); panels.push(cur);
        queue.unshift(...carry, b);
        continue;
      }
      // Block alone doesn't fit an empty panel: split its words.
      const words = b.textContent.split(/\s+/);
      let lo = 1, hi = words.length - 1, fit = 1;
      while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        const t = b.cloneNode(false); t.textContent = words.slice(0, mid).join(" ") + " …";
        body.append(t);
        if (overflows(cur)) hi = mid - 1; else { fit = mid; lo = mid + 1; }
        t.remove();
      }
      const a = b.cloneNode(false); a.textContent = words.slice(0, fit).join(" ") + " …";
      const rest = b.cloneNode(false); rest.textContent = "… " + words.slice(fit).join(" ");
      body.append(a);
      cur = makePanel(); measure.append(cur); panels.push(cur);
      queue.unshift(rest);
    }
    return panels;
  }

  function jurisdictionPanels(measure, j) {
    const card = j.card || { allowed: "", excerpts: [] };
    const blocks = [];
    blocks.push(el("p", "pc-allowed", `<strong>What's allowed:</strong> ${esc(card.allowed || "See the full page for this jurisdiction.")}`));
    for (const ex of card.excerpts) {
      blocks.push(el("p", "pc-cite", esc(ex.cite)));
      ex.text.split("\n").forEach((line) => blocks.push(el("p", "pc-law", esc(line))));
    }
    let n = 0;
    const panels = flowPanels(measure, () => panelShell(j.jurisdiction, j.status, ++n > 1 ? "cont." : ""), blocks);
    if (panels.length > 1) panels.forEach((p, i) => { p.querySelector(".pc-tag") ? (p.querySelector(".pc-tag").textContent = `${i + 1}/${panels.length}`) : p.querySelector(".pc-head").append(el("span", "pc-tag", `${i + 1}/${panels.length}`)); });
    return panels;
  }

  function coverPanel(title, js) {
    const p = el("div", "pc-panel pc-cover");
    const verified = js.map((j) => j.last_verified).sort()[0];
    p.innerHTML = `
      <div class="pc-cover-top"><span class="pc-logo">digi<b>hitch</b></span><span class="pc-kicker">Pocket law card</span></div>
      <div class="pc-cover-title">Hitchhiking laws<br><span>${esc(title)}</span></div>
      <ul class="pc-index">${js.map((j) => `<li><b>${esc(j.abbreviation)}</b> ${esc(STATUS_TEXT[j.status] || j.status)}</li>`).join("")}</ul>
      <div class="pc-cover-foot">Laws checked ${esc(verified)} · ${esc(SITE_URL())}</div>`;
    return p;
  }

  function officerPanel(js) {
    const p = el("div", "pc-panel pc-officer");
    p.innerHTML = `
      <div class="pc-head"><span class="pc-name">For the officer</span></div>
      <div class="pc-body">
        <p>Thank you for checking. Each panel in this card quotes the ${js.every((j) => j.country === "CA") ? "provincial/territorial" : "state"} law <strong>word for word</strong>, with its section number, so you can confirm it against the official code.</p>
        <p>I am trying to follow the panel for this ${js.every((j) => j.country === "CA") ? "province" : "state"}: standing where the law allows, not in the travel lanes.</p>
        <p class="pc-small">Full text and official source links: ${esc(SITE_URL())}<br>Not legal advice. Local ordinances may add rules.</p>
      </div>`;
    return p;
  }

  function notesPanel() {
    const p = el("div", "pc-panel pc-notes");
    p.innerHTML = `<div class="pc-head"><span class="pc-name">Notes</span></div><div class="pc-body"></div>`;
    return p;
  }

  function buildPocketSheets(container, title, js) {
    setPocketPageStyle(true);
    // Hidden measuring area at true print size.
    const measure = el("div", "pc-measure");
    document.body.append(measure);
    const content = [];
    js.forEach((j) => content.push(...jurisdictionPanels(measure, j)));
    measure.remove();

    // Lay out sheets: slot 0 = cover, slot 11 = officer note (both outside when folded), rest = content.
    const sheets = [];
    let i = 0;
    do {
      const slots = new Array(PANELS_PER_SIDE * 2).fill(null);
      slots[0] = coverPanel(sheets.length ? `${title} (cont.)` : title, js);
      slots[11] = officerPanel(js);
      for (let s = 0; s < slots.length && i < content.length; s++) {
        if (!slots[s]) slots[s] = content[i++];
      }
      sheets.push(slots.map((x) => x || notesPanel()));
    } while (i < content.length);

    container.innerHTML = "";
    sheets.forEach((slots, si) => {
      [0, 1].forEach((side) => {
        const wrap = el("div", "pc-side");
        wrap.append(el("div", "pc-side-label", `Sheet ${si + 1} of ${sheets.length} · Side ${side + 1} (${side ? "back" : "front"})`));
        const scaler = el("div", "pc-scaler");
        const sheet = el("div", "pc-sheet");
        slots.slice(side * 12, side * 12 + 12).forEach((p) => sheet.append(p));
        scaler.append(sheet);
        wrap.append(scaler);
        container.append(wrap);
      });
    });
    fitPreview();
  }

  function fitPreview() {
    document.querySelectorAll(".pc-scaler").forEach((sc) => {
      const sheet = sc.firstElementChild;
      const w = sheet.offsetWidth;
      const scale = Math.min(1, sc.clientWidth / w);
      sheet.style.transform = `scale(${scale})`;
      sc.style.height = sheet.offsetHeight * scale + "px";
    });
  }
  window.addEventListener("resize", () => { if (document.querySelector(".pc-scaler")) fitPreview(); });

  /* ---------- About ---------- */
  function renderAbout() {
    setActiveNav("about");
    setTitle("About");
    main.innerHTML = `
      <article class="about prose">
        <h1>About</h1>
        <p><strong>digihitch</strong> was a hitchhiking portal that ran from 2001 until about 2010. Its most useful resource was a state-by-state and province-by-province collection of the exact laws that apply to hitchhikers, with printable handouts you could carry on the road. The site went offline and was only partly recovered (see the <a href="https://github.com/Hitchwiki/digihitch">Hitchwiki archive</a>).</p>
        <p>This rebuild starts with that law reference. Every entry was researched from primary sources: the official legislature or government website wherever possible. Each entry quotes the law verbatim, links to it, and explains in plain English what it means for a hitchhiker.</p>
        <h2>How to read an entry</h2>
        <ul>
          ${statusesInUse().map((s) => `<li>${pill(s)} ${esc(STATUS_HELP[s])}</li>`).join("")}
        </ul>
        <p>Most "no soliciting rides" laws say you may not stand <em>in the roadway</em>. "Roadway" is usually defined as the part of the road used for vehicle travel, <em>not</em> the shoulder. Each entry quotes the local definition where it matters.</p>
        <p>Local cities and counties, turnpike authorities, and parks can have stricter rules than the state or province.</p>
        <h2>Contributing</h2>
        <p>Every entry is a Markdown file in <a href="${REPO}/tree/main/resources/laws"><code>resources/laws/</code></a>. Corrections are welcome as issues or pull requests. Please include a link to the official source.</p>
        <p><strong>Not legal advice.</strong> Laws change. Always check the linked official source.</p>
      </article>`;
  }

  function renderNotFound() {
    setTitle("Not found");
    main.innerHTML = `<p class="error">Page not found. <a href="#/">Back to all laws</a>.</p>`;
  }

  /* ---------- Router ---------- */
  function route() {
    const h = location.hash.replace(/^#\/?/, "");
    const [page, arg, arg2] = h.split("/");
    setPocketPageStyle(false);
    if (!page) renderHome();
    else if (page === "law" && arg) renderLaw(arg.toUpperCase());
    else if (page === "handouts") renderHandouts();
    else if (page === "handout" && arg) renderHandout(arg, arg2);
    else if (page === "about") renderAbout();
    else renderNotFound();
    main.focus({ preventScroll: true });
  }

  fetch("data/laws.json")
    .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then((d) => { DATA = d; window.addEventListener("hashchange", route); route(); })
    .catch((e) => {
      main.innerHTML = `<p class="error">Could not load data/laws.json (${esc(e.message)}). If you opened this file directly, serve the folder with a local web server instead, e.g. <code>python3 -m http.server -d site</code>.</p>`;
    });
})();
