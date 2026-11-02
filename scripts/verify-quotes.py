#!/usr/bin/env python3
"""Check that quoted law text in resources/laws/*.md appears verbatim in each section's Source link(s).

Usage: python3 scripts/verify-quotes.py [resources/laws]
Needs curl (and pdftotext for PDF sources). Fetched pages are cached in $TMPDIR/digihitch-verify-cache.
Prints sections that are PARTIAL (some quoted passages not found) or NOFETCH (source blocked/JS-only).
Formatting differences (two-column PDFs, tables) can cause PARTIAL; check those by hand.
"""
import re, sys, glob, os, hashlib, subprocess, html, json, unicodedata, tempfile
from concurrent.futures import ThreadPoolExecutor
CACHE = os.path.join(tempfile.gettempdir(), "digihitch-verify-cache")
os.makedirs(CACHE, exist_ok=True)
def fetch(url):
    h = hashlib.sha1(url.encode()).hexdigest()
    p = os.path.join(CACHE, h)
    if not os.path.exists(p):
        subprocess.run(["curl", "-sS", "-L", "--max-time", "40", "-o", p, url], capture_output=True)
    if not os.path.exists(p): return ""
    raw = open(p, "rb").read()
    if raw[:4] == b"%PDF":
        out = subprocess.run(["pdftotext", "-layout", p, "-"], capture_output=True).stdout.decode("utf8", "replace")
        return out
    t = raw.decode("utf8", "replace")
    t = re.sub(r"(?is)<(script|style).*?</\1>", " ", t)
    t = re.sub(r"<[^>]+>", " ", t)
    return html.unescape(t)
def norm(s):
    s = unicodedata.normalize("NFKC", s)
    s = s.replace("’", "'").replace("‘", "'").replace("“", '"').replace("”", '"')
    s = s.replace("–", "-").replace("—", "-").replace(" ", " ")
    s = re.sub(r"-\s*\n\s*", "", s)  # pdf hyphenation
    s = s.lower()
    s = re.sub(r"[^a-z0-9]+", " ", s)
    return re.sub(r"\s+", " ", s).strip()
results = {}
def check_file(f):
    t = open(f).read()
    body = t.split("\n## Laws", 1)[1].split("\n## ", 1)[0] if "\n## Laws" in t else ""
    secs = re.split(r"\n(?=### )", body)
    out = []
    for s in secs:
        if not s.startswith("### "): continue
        title = s.splitlines()[0][4:]
        m = re.search(r"\*\*Source:?\*\*(.*)", s)
        urls = re.findall(r"\]\((https?://[^) ]+)\)", m.group(1)) if m else []
        quote = "\n".join(l[1:] for l in s.splitlines() if l.startswith(">"))
        # fragments: split on [...] and line breaks; strip subsection labels
        frags = []
        for part in re.split(r"\[\s*(?:\.\.\.|…)\s*\]|\n", quote):
            n = norm(part)
            if len(n.split()) >= 6: frags.append(n)
        src = " ".join(norm(fetch(u)) for u in urls)
        if not src or len(src) < 200:
            out.append((title, "NOFETCH", 0, len(frags))); continue
        def found(fr):
            if fr in src: return True
            # allow dropped subsection labels: check sliding 8-word windows
            w = fr.split()
            if len(w) < 8: return False
            hits = sum(1 for i in range(0, len(w) - 7, 4) if " ".join(w[i:i+8]) in src)
            total = len(range(0, len(w) - 7, 4))
            return total and hits / total >= 0.8
        ok = sum(1 for fr in frags if found(fr))
        out.append((title, "OK" if ok == len(frags) else "PARTIAL", ok, len(frags)))
    return os.path.basename(f), out
files = sorted(glob.glob((sys.argv[1] if len(sys.argv) > 1 else "resources/laws") + "/[A-Z][A-Z]_[A-Z][A-Z].md"))
with ThreadPoolExecutor(12) as ex:
    for name, out in ex.map(check_file, files):
        results[name] = out
tot = {"OK": 0, "PARTIAL": 0, "NOFETCH": 0}
for name, out in results.items():
    for title, st, ok, n in out:
        tot[st] += 1
        if st != "OK": print(f"{name:10} {st:8} {ok}/{n}  {title[:90]}")
print(tot)
