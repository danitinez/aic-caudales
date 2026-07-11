import es from './es.json';

// Dot-path lookup into the es dictionary, e.g. t('sections.arroyito.title').
// Returns `fallback` (or the key itself) when the path resolves to nothing.
export function t(key, fallback) {
  const val = key.split('.').reduce(
    (obj, part) => (obj && typeof obj === 'object' ? obj[part] : undefined),
    es
  );
  return val !== undefined ? val : (fallback !== undefined ? fallback : key);
}
