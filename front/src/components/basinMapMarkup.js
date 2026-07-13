import svgRaw from '../assets/basin-map.svg?raw';

// Per-section zoom viewBoxes embedded by scripts/gen_basin_map.py as
// data-vb-<section_id> attributes on the svg root.
export const VIEWBOXES = Object.fromEntries(
  [...svgRaw.matchAll(/data-vb-([a-z_]+)="([^"]+)"/g)].map(m => [m[1], m[2]])
);

// Builds the basin SVG markup, optionally highlighting one section's
// stretch, zooming to its viewBox, and/or coloring stretches by flow status.
// statusColors: { [sectionId]: cssColor } — painted as inline style so it
// wins over the .tramo/.tramo.active rules (selection stays a stroke-width
// change so the status color remains visible while selected).
export function mapMarkup(sectionId, { zoom = false, statusColors = null } = {}) {
  let svg = svgRaw;
  if (sectionId) {
    svg = svg.replace(
      `class="tramo" id="tramo-${sectionId}"`,
      `class="tramo active" id="tramo-${sectionId}"`
    );
  }
  if (zoom && VIEWBOXES[sectionId]) {
    svg = svg.replace(/viewBox="[^"]+"/, `viewBox="${VIEWBOXES[sectionId]}"`);
  }
  if (statusColors) {
    for (const [id, color] of Object.entries(statusColors)) {
      svg = svg.replace(
        `id="tramo-${id}" `,
        `id="tramo-${id}" style="stroke:${color}" `
      );
    }
  }
  return svg;
}
