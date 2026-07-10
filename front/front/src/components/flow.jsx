import React from 'react';

// Single source of truth for flow classification. Used by the section badge,
// the alert banner, and every day cell so they can never disagree with each
// other (previously sectionDanger/levelDanger/flowLabel used different math).

export function displayValue(level) {
  return Math.round((level.min + level.max) / 2);
}

export function AlertTriangleIcon({ className }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

export function AlertOctagonIcon({ className }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

export function ChevronIcon({ className }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

const CLASSES = {
  bajo: {
    label: 'Bajo', severity: 'low',
    colors: { text: 'text-blue-400', border: 'border-blue-500/30', bg: 'bg-blue-500/10', dot: 'bg-blue-400' },
  },
  medio: {
    label: 'Medio', severity: 'normal',
    colors: { text: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500/10', dot: 'bg-emerald-400' },
  },
  alto: {
    label: 'Alto', severity: 'warn',
    colors: { text: 'text-amber-400', border: 'border-amber-500/30', bg: 'bg-amber-500/10', dot: 'bg-amber-400' },
  },
  muy_alto: {
    label: 'Muy alto', severity: 'danger',
    colors: { text: 'text-red-400', border: 'border-red-500/30', bg: 'bg-red-500/10', dot: 'bg-red-400' },
  },
};

// Badness order, worst first — used to pick the section-level status.
const BADNESS_ORDER = ['muy_alto', 'alto', 'bajo', 'medio'];

// Bucket = position within the historical range, as a percentage of it (can
// go negative or past 100 when the value falls outside min/max entirely).
// 0-33% bajo, 33-66% medio, 66-80% alto, 80%+ muy alto.
export function classifyFlow(value, limits) {
  if (!limits) {
    return { key: 'medio', ...CLASSES.medio, alert: null, Icon: null };
  }
  const { min, max } = limits;
  const range = max - min;
  const pct = range > 0 ? ((value - min) / range) * 100 : 50;

  let key;
  if (pct <= 33) key = 'bajo';
  else if (pct <= 66) key = 'medio';
  else if (pct <= 80) key = 'alto';
  else key = 'muy_alto';

  const cls = CLASSES[key];

  // The alert banner flags values genuinely outside the historical range —
  // independent of the bucket, so "Bajo" (low third of a normal range)
  // doesn't spuriously trigger it.
  let alert = null;
  let Icon = null;
  if (value < min) {
    alert = 'El caudal se encuentra por debajo del mínimo esperado.';
    Icon = AlertTriangleIcon;
  } else if (value > max) {
    alert = 'El caudal supera el máximo histórico. Extremar precauciones.';
    Icon = AlertOctagonIcon;
  } else if (key === 'alto') {
    Icon = AlertTriangleIcon;
  }

  return { key, ...cls, alert, Icon };
}

// Worst classification among a list of levels — used for the section badge
// and alert banner, so they always agree with the individual day cells.
export function worstClassification(levels, limits) {
  if (!levels.length) return classifyFlow(0, limits);
  const classifications = levels.map(l => classifyFlow(displayValue(l), limits));
  for (const key of BADNESS_ORDER) {
    const found = classifications.find(c => c.key === key);
    if (found) return found;
  }
  return classifications[0];
}
