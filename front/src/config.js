import sectionsConfig from '../../sections_config.json';

const LEGACY_ID_ALIASES = sectionsConfig.legacy_id_aliases ?? {};

// Old published JSONs (latest.json / weather.json before the next scraper
// run) may still carry pre-rename ids; normalize everything to current ids.
export const normalizeId = (id) => LEGACY_ID_ALIASES[id] ?? id;

// Ordered river groups: rivers array order = display order,
// sections array order (= AIC table row order) = order within each group.
export const RIVER_GROUPS = sectionsConfig.rivers.map(river => ({
  id: river.id,
  glyph: river.glyph,
  ids: sectionsConfig.sections.filter(s => s.river_id === river.id).map(s => s.id),
}));
