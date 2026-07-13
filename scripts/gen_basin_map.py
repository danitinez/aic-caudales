#!/usr/bin/env python3
"""Generates front/src/assets/basin-map.svg from scripts/basin_map_data.json
(real geometry extracted from OpenStreetMap by scripts/build_basin_data.py).

River stretches carry ids matching sections_config.json ("tramo-<section_id>")
so the frontend highlights the active section via CSS. Per-section zoom
viewBoxes are embedded as data-vb-<section_id> attributes on the svg root.
Labels/markers live in <g class="map-labels">/<g class="map-markers"> so a
mini rendering can hide them."""

import json
import math
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = json.load(open(os.path.join(ROOT, "scripts", "basin_map_data.json")))

# --- projection ---------------------------------------------------------
all_pts = (DATA["province"]
           + [p for r in DATA["rivers"].values() for p in r]
           + [p for l in DATA["lakes"].values() for p in l])
LON_MIN = min(p[0] for p in all_pts) - 0.10
LON_MAX = max(p[0] for p in all_pts) + 0.10
LAT_MIN = min(p[1] for p in all_pts) - 0.10
LAT_MAX = max(p[1] for p in all_pts) + 0.10
MID_LAT = math.radians((LAT_MIN + LAT_MAX) / 2)
K = 120.0  # px per degree of latitude
PAD = 10

W = (LON_MAX - LON_MIN) * math.cos(MID_LAT) * K + 2 * PAD
H = (LAT_MAX - LAT_MIN) * K + 2 * PAD


def xy(lon, lat):
    x = (lon - LON_MIN) * math.cos(MID_LAT) * K + PAD
    y = (LAT_MAX - lat) * K + PAD
    return round(x, 1), round(y, 1)


def path_d(points, close=False):
    pts = [xy(*p) for p in points]
    d = f"M {pts[0][0]} {pts[0][1]}"
    last = pts[0]
    for p in pts[1:]:
        if p == last:
            continue
        d += f" L {p[0]} {p[1]}"
        last = p
    if close:
        d += " Z"
    return d


RIVERS = DATA["rivers"]
IDX = {k: v[1] for k, v in DATA["dam_river_index"].items()}

# context stretches (no section attached) / section stretches (tramo-<id>)
limay, neuquen, rio_negro = RIVERS["limay"], RIVERS["neuquen"], RIVERS["rio_negro"]
CONTEXT = [
    limay[: IDX["pichi_picun_leufu"] + 1],
    limay[IDX["el_chocon"]: IDX["arroyito"] + 1],
    neuquen[: IDX["portezuelo_grande"] + 1],
]
TRAMOS = {
    "pichi_picun_leufu": limay[IDX["pichi_picun_leufu"]: IDX["el_chocon"] + 1],
    "arroyito": limay[IDX["arroyito"]:],
    "portezuelo_grande": neuquen[IDX["portezuelo_grande"]: IDX["el_chanar"] + 1],
    "el_chanar": neuquen[IDX["el_chanar"]:],
    "el_chanar_arroyito": rio_negro,
}

DAM_LABELS = {  # id -> (label, side)
    "alicura": ("Alicurá", "e"),
    "piedra_del_aguila": ("Piedra del Águila", "e"),
    "pichi_picun_leufu": ("Pichi Picún Leufú", "e"),
    "el_chocon": ("El Chocón", "s"),
    "arroyito": ("Arroyito", "s"),
    "portezuelo_grande": ("Portezuelo Grande", "w"),
    "el_chanar": ("El Chañar", "n"),
}

# Around the confluence the cities are too dense for a province-scale map:
# Plottier / Senillosa keep an unlabeled dot (their names live in the section
# titles anyway).
CITIES = {
    "neuquen": (-68.059, -38.952, "Neuquén", "s"),
    "cipolletti": (-67.990, -38.934, "Cipolletti", "ne"),
    "centenario": (-68.132, -38.830, "Centenario", "w"),
    "plottier": (-68.234, -38.966, None, "s"),
    "senillosa": (-68.434, -39.011, None, "s"),
    "allen": (-67.829, -38.977, "Allen", "e"),
    "chos_malal": (-70.271, -37.378, "Chos Malal", "w"),
}

LAKE_LABELS = {  # id -> (label lon, lat) or None for unlabeled
    "nahuel_huapi": ("Nahuel Huapi", -71.35, -41.20),
    "ramos_mexia": ("E. Ramos Mexía", -69.30, -39.75),
    "los_barreales": ("Los Barreales", -68.85, -38.26),
    "mari_menuco": ("Marí Menuco", -68.38, -38.80),
    "alicura": None,
    "piedra_del_aguila": None,
    "arroyito": None,
}

RIVER_NAME_LABELS = [
    (-70.62, -40.30, "Río Limay", -33),
    (-70.05, -37.55, "Río Neuquén", 62),
    (-67.55, -39.25, "Río Negro", 10),
]

# Cerros Colorados diversion, schematic: dam -> Barreales -> Marí Menuco -> river
CANAL = [
    DATA["dams"]["portezuelo_grande"],
    (-68.86, -38.46), (-68.72, -38.50),          # Los Barreales
    (-68.60, -38.56), (-68.50, -38.62),          # Marí Menuco
    (-68.42, -38.72), (-68.34, -38.73), (-68.31, -38.66),  # back to the river
]

LABEL_OFF = {"n": (0, -7, "middle"), "s": (0, 13, "middle"),
             "e": (8, 4, "start"), "w": (-8, 4, "end"), "ne": (6, -6, "start")}


def marker(kind, key, lon, lat, label, side):
    x, y = xy(lon, lat)
    dx, dy, anchor = LABEL_OFF[side]
    if kind == "dam":
        shape = f'<rect x="{x - 3.2}" y="{y - 3.2}" width="6.4" height="6.4" transform="rotate(45 {x} {y})" class="dam"/>'
    else:
        shape = f'<circle cx="{x}" cy="{y}" r="2.6" class="city"/>'
    text = (f'<text x="{x + dx}" y="{y + dy}" text-anchor="{anchor}" class="lbl lbl-{kind}">{label}</text>'
            if label else "")
    return shape, text


def tramo_viewbox(points, min_span=200.0, pad=32.0):
    """Square-ish viewBox around a stretch, clamped to the svg canvas."""
    pts = [xy(*p) for p in points]
    x0, x1 = min(p[0] for p in pts) - pad, max(p[0] for p in pts) + pad
    y0, y1 = min(p[1] for p in pts) - pad, max(p[1] for p in pts) + pad
    w, h = x1 - x0, y1 - y0
    side = max(w, h, min_span)
    x0 -= (side - w) / 2
    y0 -= (side - h) / 2
    x0 = min(max(x0, 0), W - side) if side < W else 0
    y0 = min(max(y0, 0), H - side) if side < H else 0
    side_x = min(side, W)
    side_y = min(side, H)
    return f"{x0:.0f} {y0:.0f} {side_x:.0f} {side_y:.0f}"


vb_attrs = " ".join(f'data-vb-{sid}="{tramo_viewbox(pts)}"' for sid, pts in TRAMOS.items())

svg = []
svg.append(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W:.0f} {H:.0f}" '
           f'{vb_attrs} font-family="system-ui, sans-serif" role="img" '
           f'aria-label="Mapa de la cuenca de los ríos Limay, Neuquén y Negro">')
svg.append(f"<!-- {DATA['attribution']} -->")
svg.append("""<style>
  .province { fill: var(--map-land, #eef3f0); stroke: var(--map-border, #b9c6bf); stroke-width: 1.2; stroke-linejoin: round; }
  .river { fill: none; stroke: var(--map-river, #9db8cc); stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }
  .canal { fill: none; stroke: var(--map-river, #9db8cc); stroke-width: 1.3; stroke-dasharray: 3 3; stroke-linecap: round; }
  .tramo { fill: none; stroke: var(--map-river, #9db8cc); stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }
  .tramo.active { stroke: var(--map-highlight, #0E7466); stroke-width: 5; }
  .tramo-hit { fill: none; stroke: #000; stroke-opacity: 0; stroke-width: 16; pointer-events: stroke; }
  .lake { fill: var(--map-lake, #c3d8e8); stroke: none; }
  .dam { fill: var(--map-dam, #5a6b77); }
  .city { fill: none; stroke: var(--map-city, #6b7a72); stroke-width: 1.4; }
  .lbl { font-size: 10px; fill: var(--map-text, #4a564f); }
  .lbl-dam { font-weight: 600; fill: var(--map-text-strong, #333d44); }
  .lbl-river { font-size: 11px; font-style: italic; fill: var(--map-river-text, #6f8ca3); }
  .lbl-lake { font-size: 9px; font-style: italic; fill: var(--map-river-text, #6f8ca3); }
</style>""")

svg.append(f'<path class="province" d="{path_d(DATA["province"], close=True)}"/>')

for lid, pts in DATA["lakes"].items():
    svg.append(f'<path class="lake" d="{path_d(pts, close=True)}"/>')

svg.append(f'<path class="canal" d="{path_d(CANAL)}"/>')

for pts in CONTEXT:
    svg.append(f'<path class="river" d="{path_d(pts)}"/>')

tramo_ds = {}
for sid, pts in TRAMOS.items():
    d = path_d(pts)
    tramo_ds[sid] = d
    svg.append(f'<path class="tramo" id="tramo-{sid}" d="{d}"/>')

markers, labels = [], []

for lid, lbl in LAKE_LABELS.items():
    if lbl:
        name, llon, llat = lbl
        lx, ly = xy(llon, llat)
        labels.append(f'<text x="{lx}" y="{ly}" text-anchor="middle" class="lbl lbl-lake">{name}</text>')

for lon, lat, name, rot in RIVER_NAME_LABELS:
    x, y = xy(lon, lat)
    labels.append(f'<text x="{x}" y="{y}" text-anchor="middle" class="lbl lbl-river" '
                  f'transform="rotate({rot} {x} {y})">{name}</text>')

for did, (label, side) in DAM_LABELS.items():
    lon, lat = DATA["dams"][did]
    shape, text = marker("dam", did, lon, lat, label, side)
    markers.append(shape)
    labels.append(text)

for key, (lon, lat, label, side) in CITIES.items():
    shape, text = marker("city", key, lon, lat, label, side)
    markers.append(shape)
    if text:
        labels.append(text)

svg.append('<g class="map-markers">' + "".join(markers) + "</g>")
svg.append('<g class="map-labels">' + "".join(labels) + "</g>")

hits = "".join(
    f'<path class="tramo-hit" data-section="{sid}" d="{d}"/>'
    for sid, d in tramo_ds.items()
)
svg.append(f'<g class="map-hit">{hits}</g>')
svg.append("</svg>")

out = os.path.join(ROOT, "front", "src", "assets", "basin-map.svg")
os.makedirs(os.path.dirname(out), exist_ok=True)
with open(out, "w") as f:
    f.write("\n".join(svg) + "\n")
print(f"wrote {out} ({W:.0f}x{H:.0f}, {os.path.getsize(out)} bytes)")
