#!/usr/bin/env python3
"""Builds scripts/basin_map_data.json from OpenStreetMap extracts: the Neuquén
province polygon, the Limay / Neuquén / Negro river centerlines and the main
lakes/reservoirs. The output JSON is committed, so this only needs re-running
if the geometry should be refreshed; scripts/gen_basin_map.py consumes it
offline. Downloads are cached in <system tmp>/aic-basin-cache to be gentle
with Overpass (delete the cache dir to force a refetch).

Data © OpenStreetMap contributors, ODbL 1.0."""

import heapq
import json
import math
import os
import re
import tempfile
import urllib.parse
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(tempfile.gettempdir(), "aic-basin-cache")
os.makedirs(CACHE, exist_ok=True)
UA = {"User-Agent": "aic-caudales-map/1.0 (github.com/danitinez/aic-caudales)"}

PROVINCE_RELATION = 1606727  # OSM relation: Provincia del Neuquén


def fetch(name, url, data=None):
    path = os.path.join(CACHE, name)
    if os.path.exists(path):
        return open(path).read()
    req = urllib.request.Request(url, data=data, headers=UA)
    body = urllib.request.urlopen(req, timeout=180).read().decode()
    with open(path, "w") as f:
        f.write(body)
    return body


def overpass(name, query):
    return json.loads(fetch(
        name, "https://overpass-api.de/api/interpreter",
        ("data=" + urllib.parse.quote(query)).encode()))


def dist(a, b):
    # planar approx, degrees (fine at this scale for shaping)
    dx = (a[0] - b[0]) * 0.78
    dy = a[1] - b[1]
    return math.hypot(dx, dy)


def rdp(points, eps):
    if len(points) < 3:
        return points
    ax, ay = points[0]
    bx, by = points[-1]
    dmax, idx = -1.0, 0
    dx, dy = bx - ax, by - ay
    norm = math.hypot(dx, dy)
    for i in range(1, len(points) - 1):
        px, py = points[i]
        if norm == 0:
            d = math.hypot(px - ax, py - ay)
        else:
            d = abs(dy * px - dx * py + bx * ay - by * ax) / norm
        if d > dmax:
            dmax, idx = d, i
    if dmax > eps:
        return rdp(points[: idx + 1], eps)[:-1] + rdp(points[idx:], eps)
    return [points[0], points[-1]]


def rounded(points):
    return [(round(x, 4), round(y, 4)) for x, y in points]


# ---------------------------------------------------------------- rivers ----
def chain_river(ways, start_anchor, end_anchor):
    """Chain OSM ways into one polyline from ~start_anchor to ~end_anchor via
    shortest path (virtual bridging edges cross gaps, e.g. through reservoirs;
    braided channels resolve to one arm)."""
    endpoints, nodes = {}, []

    def node_id(pt):
        k = (round(pt[0], 6), round(pt[1], 6))
        if k not in endpoints:
            endpoints[k] = len(nodes)
            nodes.append(pt)
        return endpoints[k]

    edges, adj = {}, {}

    def add_edge(u, v, length, coords):
        if u == v:
            return
        if (u, v) not in edges or edges[(u, v)][0] > length:
            edges[(u, v)] = (length, coords)
            edges[(v, u)] = (length, list(reversed(coords)))
            adj.setdefault(u, set()).add(v)
            adj.setdefault(v, set()).add(u)

    for w in ways:
        coords = [(n["lon"], n["lat"]) for n in w["geometry"]]
        if len(coords) < 2:
            continue
        length = sum(dist(coords[i], coords[i + 1]) for i in range(len(coords) - 1))
        add_edge(node_id(coords[0]), node_id(coords[-1]), length, coords)

    # virtual edges bridge nearby endpoints (penalized so real ways win)
    n = len(nodes)
    for i in range(n):
        for j in range(i + 1, n):
            d = dist(nodes[i], nodes[j])
            if 0 < d < 0.18 and j not in adj.get(i, set()):
                add_edge(i, j, d * 4.0, [nodes[i], nodes[j]])

    def nearest(anchor):
        return min(range(n), key=lambda i: dist(nodes[i], anchor))

    src, dst = nearest(start_anchor), nearest(end_anchor)
    INF = float("inf")
    distv, prev = [INF] * n, [None] * n
    distv[src] = 0
    pq = [(0.0, src)]
    while pq:
        d, u = heapq.heappop(pq)
        if d > distv[u]:
            continue
        if u == dst:
            break
        for v in adj.get(u, ()):
            nd = d + edges[(u, v)][0]
            if nd < distv[v]:
                distv[v] = nd
                prev[v] = u
                heapq.heappush(pq, (nd, v))
    if distv[dst] == INF:
        raise RuntimeError("no path between river anchors")

    path, u = [], dst
    while prev[u] is not None:
        path.append((prev[u], u))
        u = prev[u]
    path.reverse()

    coords = []
    for u, v in path:
        seg = edges[(u, v)][1]
        coords.extend(seg if not coords else seg[1:])
    return coords


rivers_raw = overpass("rivers.json", """
[out:json][timeout:60];
(way["waterway"="river"]["name"="Río Limay"](-41.2,-72.0,-38.5,-67.9);
 way["waterway"="river"]["name"="Río Neuquén"](-39.2,-71.5,-36.0,-68.0);
 way["waterway"="river"]["name"="Río Negro"](-39.6,-68.3,-38.7,-66.9););
out geom;""")

by_name = {}
for e in rivers_raw["elements"]:
    by_name.setdefault(e["tags"]["name"], []).append(e)

RIVER_SPECS = {  # id -> (OSM name, upstream anchor, downstream anchor)
    "limay": ("Río Limay", (-71.10, -40.99), (-68.00, -38.98)),
    "neuquen": ("Río Neuquén", (-70.75, -36.50), (-68.00, -38.98)),
    "rio_negro": ("Río Negro", (-68.00, -38.98), (-66.95, -39.30)),
}

rivers = {}
for rid, (name, a, b) in RIVER_SPECS.items():
    line = chain_river(by_name[name], a, b)
    simp = rounded(rdp(line, 0.0015))
    rivers[rid] = simp
    print(f"{rid}: {len(by_name[name])} ways -> {len(line)} pts -> {len(simp)} pts")

# --------------------------------------------------------------- province ---
prov_raw = json.loads(fetch(
    "neuquen.geojson",
    f"https://polygons.openstreetmap.fr/get_geojson.py?id={PROVINCE_RELATION}"
    "&params=0.010000-0.005000-0.005000"))
province = rounded(rdp(prov_raw["coordinates"][0], 0.008))
print(f"province: {len(prov_raw['coordinates'][0])} -> {len(province)} pts")

# ------------------------------------------------------------------ lakes ---
LAKE_QUERIES = {
    "nahuel_huapi": 'nwr["natural"="water"]["name"="Lago Nahuel Huapi"](-41.4,-71.9,-40.6,-71.0);',
    "alicura": 'nwr["natural"="water"]["name"~"Alicurá"](-40.9,-71.2,-40.3,-70.6);',
    "piedra_del_aguila": 'nwr["natural"="water"]["name"~"Piedra del Águila"](-40.6,-70.6,-39.9,-69.9);',
    "ramos_mexia": 'nwr["natural"="water"]["name"~"Ramos Mexía"](-39.9,-69.9,-39.1,-68.6);',
    "arroyito": 'nwr["natural"="water"]["name"~"Arroyito"](-39.3,-68.8,-39.0,-68.3);',
    "los_barreales": 'nwr["natural"="water"]["name"~"Barreales"](-38.8,-69.2,-38.2,-68.4);',
    "mari_menuco": 'nwr["natural"="water"]["name"~"Mar[ií] Menuco"](-38.8,-68.8,-38.3,-68.2);',
}
lakes_raw = overpass(
    "lakes.json",
    '[out:json][timeout:90];(' + "".join(LAKE_QUERIES.values()) + ');out geom;')
print("lake elements:", len(lakes_raw["elements"]))


def rings_from_element(e):
    """Closed ring(s) from an OSM way or multipolygon relation (outer only)."""
    if e["type"] == "way":
        return [[(n["lon"], n["lat"]) for n in e["geometry"]]]
    if e["type"] != "relation":
        return []
    segs = [[(n["lon"], n["lat"]) for n in m["geometry"]]
            for m in e.get("members", [])
            if m.get("role") == "outer" and "geometry" in m]
    rings, cur = [], None
    while segs:
        if cur is None:
            cur = segs.pop(0)
        if dist(cur[0], cur[-1]) < 1e-9 and len(cur) > 3:
            rings.append(cur)
            cur = None
            continue
        for i, s in enumerate(segs):
            if dist(s[0], cur[-1]) < 1e-7:
                cur.extend(segs.pop(i)[1:])
                break
            if dist(s[-1], cur[-1]) < 1e-7:
                cur.extend(list(reversed(segs.pop(i)))[1:])
                break
        else:
            rings.append(cur)  # unclosed ring: keep what we have
            cur = None
    if cur:
        rings.append(cur)
    return rings


def ring_area(r):
    return abs(sum(r[i][0] * r[i + 1][1] - r[i + 1][0] * r[i][1]
                   for i in range(len(r) - 1))) / 2


lakes = {}
for lid, q in LAKE_QUERIES.items():
    # match by bbox: largest ring whose centroid falls in the query's bbox
    s, w_, n_, e_ = map(float, re.search(
        r"\(([-\d.]+),([-\d.]+),([-\d.]+),([-\d.]+)\)", q).groups())
    best, best_area, best_name = None, 0.0, ""
    for e in lakes_raw["elements"]:
        for r in rings_from_element(e):
            if len(r) < 4:
                continue
            cx = sum(p[0] for p in r) / len(r)
            cy = sum(p[1] for p in r) / len(r)
            if not (w_ <= cx <= e_ and s <= cy <= n_):
                continue
            a = ring_area(r)
            if a > best_area:
                best, best_area = r, a
                best_name = e.get("tags", {}).get("name", "")
    if best is None:
        raise RuntimeError(f"lake {lid} not found")
    simp = rounded(rdp(best, 0.004))
    lakes[lid] = simp
    print(f"lake {lid}: {len(best)} -> {len(simp)} pts  ({best_name})")

# ------------------------------------------------- dams snapped to rivers ---
DAM_ANCHORS = {  # id -> (river, approx position; snapped to nearest river pt)
    "alicura": ("limay", (-70.75, -40.59)),
    "piedra_del_aguila": ("limay", (-70.01, -40.18)),
    "pichi_picun_leufu": ("limay", (-69.75, -39.95)),
    "el_chocon": ("limay", (-68.75, -39.26)),
    "arroyito": ("limay", (-68.53, -39.10)),
    "portezuelo_grande": ("neuquen", (-68.92, -38.43)),
    "el_chanar": ("neuquen", (-68.30, -38.62)),
}
dams, dam_river_index = {}, {}
for did, (rid, anchor) in DAM_ANCHORS.items():
    line = rivers[rid]
    i = min(range(len(line)), key=lambda k: dist(line[k], anchor))
    dams[did] = line[i]
    dam_river_index[did] = (rid, i)
    print(f"dam {did}: snapped to {line[i]} (idx {i}/{len(line)})")

# upstream->downstream order along each river must hold for tramo splitting
for pair in (("pichi_picun_leufu", "el_chocon"), ("el_chocon", "arroyito"),
             ("portezuelo_grande", "el_chanar")):
    assert dam_river_index[pair[0]][1] < dam_river_index[pair[1]][1], pair

out = {
    "attribution": "Geometry (c) OpenStreetMap contributors, ODbL 1.0",
    "province": province,
    "rivers": rivers,
    "lakes": lakes,
    "dams": dams,
    "dam_river_index": dam_river_index,
}
path = os.path.join(ROOT, "scripts", "basin_map_data.json")
with open(path, "w") as f:
    json.dump(out, f, separators=(",", ":"))
print("wrote", path)
