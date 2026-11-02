#!/usr/bin/env python3
"""Build site/data/map.json: pre-projected SVG paths for US states + Canadian provinces/territories.

Source: Natural Earth 1:50m admin-1 states/provinces (public domain).
Usage:  python3 scripts/build-map.py path/to/ne_50m_admin_1_states_provinces.geojson
Download: https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_1_states_provinces.geojson

Only needs re-running if the map geometry or layout should change (law data does not affect it).
"""
import json, math, sys, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "site", "data", "map.json")

# Albers equal-area conic tuned for the US + Canada.
LON0, LAT0, P1, P2 = -100.0, 45.0, 40.0, 65.0
WIDTH = 1000.0
MAX_LAT = 76.0  # clip the high Arctic so it doesn't dominate the map


def albers_factory(lon0, lat0, p1, p2):
    r = math.radians
    n = (math.sin(r(p1)) + math.sin(r(p2))) / 2
    c = math.cos(r(p1)) ** 2 + 2 * n * math.sin(r(p1))
    rho0 = math.sqrt(c - 2 * n * math.sin(r(lat0))) / n

    def proj(lon, lat):
        rho = math.sqrt(max(c - 2 * n * math.sin(r(lat)), 0)) / n
        th = n * r(lon - lon0)
        return rho * math.sin(th), -(rho0 - rho * math.cos(th))  # y down

    return proj


def dp(points, tol):
    """Douglas-Peucker simplification."""
    if len(points) < 3:
        return points
    keep = [False] * len(points)
    keep[0] = keep[-1] = True
    stack = [(0, len(points) - 1)]
    while stack:
        a, b = stack.pop()
        ax, ay = points[a]; bx, by = points[b]
        dx, dy = bx - ax, by - ay
        norm = math.hypot(dx, dy)
        best, idx = -1, -1
        for i in range(a + 1, b):
            px, py = points[i]
            if norm < 1e-9:  # closed ring: endpoints coincide, use point distance
                d = math.hypot(px - ax, py - ay)
            else:
                d = abs(dy * px - dx * py + bx * ay - by * ax) / norm
            if d > best:
                best, idx = d, i
        if best > tol:
            keep[idx] = True
            stack += [(a, idx), (idx, b)]
    return [p for p, k in zip(points, keep) if k]


def area(ring):
    return abs(sum(x1 * y2 - x2 * y1 for (x1, y1), (x2, y2) in zip(ring, ring[1:] + ring[:1]))) / 2


def centroid(ring):
    a = cx = cy = 0.0
    for (x1, y1), (x2, y2) in zip(ring, ring[1:] + ring[:1]):
        f = x1 * y2 - x2 * y1
        a += f; cx += (x1 + x2) * f; cy += (y1 + y2) * f
    if abs(a) < 1e-9:
        return ring[0]
    return cx / (3 * a), cy / (3 * a)


def polygons(geom):
    if geom["type"] == "Polygon":
        return [geom["coordinates"]]
    return geom["coordinates"]


def main(src):
    data = json.load(open(src, encoding="utf8"))
    feats = [f for f in data["features"] if f["properties"].get("iso_a2") in ("US", "CA")]
    proj = albers_factory(LON0, LAT0, P1, P2)
    # Hawaii gets its own projection, then is moved into an inset.
    proj_hi = albers_factory(-157.0, 20.0, 18.0, 23.0)

    raw = {}
    for f in feats:
        p = f["properties"]
        code = f"{p['iso_a2']}_{p['postal']}"
        rings = []
        for poly in polygons(f["geometry"]):
            outer = poly[0]
            if code != "US_HI" and all(lat > MAX_LAT for _, lat in outer):
                continue
            if code == "US_HI" and all(lon < -160.5 for lon, _ in outer):
                continue  # drop the tiny Northwestern Hawaiian Islands so the inset stays compact
            pts = [(proj_hi if code == "US_HI" else proj)(lon, min(lat, MAX_LAT + 1)) for lon, lat in outer]
            rings.append(pts)
        raw[code] = rings

    # Fit mainland (everything but HI) into WIDTH.
    xs = [x for c, rs in raw.items() if c != "US_HI" for r in rs for x, _ in r]
    ys = [y for c, rs in raw.items() if c != "US_HI" for r in rs for _, y in r]
    minx, maxx, miny, maxy = min(xs), max(xs), min(ys), max(ys)
    s = WIDTH / (maxx - minx)
    height = (maxy - miny) * s

    def fit(pt):
        return ((pt[0] - minx) * s, (pt[1] - miny) * s)

    out = {}
    for code, rings in raw.items():
        if code == "US_HI":
            continue
        out[code] = [[fit(p) for p in r] for r in rings]

    # Hawaii inset: scale to match the mainland and place it bottom-left.
    hx = [x for r in raw["US_HI"] for x, _ in r]; hy = [y for r in raw["US_HI"] for _, y in r]
    hs = s * 1.6  # enlarged so the islands are clickable
    hw = (max(hx) - min(hx)) * hs; hh = (max(hy) - min(hy)) * hs
    ox, oy = 40.0, height - hh - 30
    out["US_HI"] = [[((x - min(hx)) * hs + ox, (y - min(hy)) * hs + oy) for x, y in r] for r in raw["US_HI"]]

    shapes, labels = [], []
    for code, rings in sorted(out.items()):
        parts, biggest = [], None
        for r in rings:
            ring = r[:-1] if r[0] == r[-1] else r
            r2 = dp(ring + [ring[0]], 0.35)[:-1]
            if len(r2) < 3 or area(r2) < 1.5:
                continue
            if biggest is None or area(r2) > area(biggest):
                biggest = r2
            parts.append("M" + "L".join(f"{x:.1f},{y:.1f}" for x, y in r2) + "Z")
        if not parts:  # tiny jurisdiction (e.g. DC): keep the raw biggest ring
            r = max(rings, key=area)
            parts.append("M" + "L".join(f"{x:.1f},{y:.1f}" for x, y in r) + "Z")
            biggest = r
        shapes.append({"code": code, "d": "".join(parts)})
        cx, cy = centroid(biggest)
        labels.append({"code": code, "x": round(cx, 1), "y": round(cy, 1), "area": round(area(biggest))})

    # Clickable chips for jurisdictions too small to click comfortably.
    small = ["US_VT", "US_NH", "US_MA", "US_RI", "US_CT", "US_NJ", "US_DE", "US_MD", "US_DC", "CA_PE"]
    lab = {l["code"]: l for l in labels}
    chips = []
    base_x = max(lab["US_MA"]["x"], lab["CA_NS"]["x"] if "CA_NS" in lab else 0) + 60
    base_y = lab["US_VT"]["y"] - 40
    for i, code in enumerate(small):
        chips.append({"code": code, "x": round(base_x + (i % 2) * 52, 1), "y": round(base_y + (i // 2) * 30, 1),
                      "tx": lab[code]["x"], "ty": lab[code]["y"]})
    for l in labels:
        l["show"] = l["code"] not in small and l["area"] > 250
        del l["area"]

    result = {
        "source": "Natural Earth 1:50m admin-1 (public domain), Albers equal-area conic",
        "width": WIDTH, "height": round(height, 1),
        "hawaiiInset": {"x": ox - 10, "y": oy - 10, "w": hw + 20, "h": hh + 20},
        "shapes": shapes, "labels": labels, "chips": chips,
    }
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w") as fh:
        json.dump(result, fh, separators=(",", ":"))
    print(f"Wrote {len(shapes)} shapes, {os.path.getsize(OUT)//1024} KB, viewBox 0 0 {WIDTH:.0f} {height:.0f}")


if __name__ == "__main__":
    main(sys.argv[1])
