import sectionsConfig from '../../sections_config.json';

const LEGACY_ID_ALIASES = sectionsConfig.legacy_id_aliases ?? {};

// Old published JSONs (latest.json / weather.json before the next scraper
// run) may still carry pre-rename ids; normalize everything to current ids.
export const normalizeId = (id) => LEGACY_ID_ALIASES[id] ?? id;

// Ordered river groups: rivers array order = display order. Within each
// group, sections sort by display_order — a purely visual field, independent
// from the sections array's own position (= AIC table row order), which
// DataGatherer relies on to assign ids by row index and must stay untouched.
export const RIVER_GROUPS = sectionsConfig.rivers.map(river => ({
  id: river.id,
  glyph: river.glyph,
  ids: sectionsConfig.sections
    .filter(s => s.river_id === river.id)
    .sort((a, b) => a.display_order - b.display_order)
    .map(s => s.id),
}));

// Same grouping for embalses (lakes/reservoirs). Lake ids aren't tied to a
// row position anywhere, so array order here doubles as display order.
export const LAKE_RIVER_GROUPS = sectionsConfig.rivers
  .map(river => ({
    id: river.id,
    glyph: river.glyph,
    ids: (sectionsConfig.lakes ?? []).filter(l => l.river_id === river.id).map(l => l.id),
  }))
  .filter(group => group.ids.length);
