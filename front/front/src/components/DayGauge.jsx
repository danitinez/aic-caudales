import React from 'react';

// Vertical staff gauge: fill height is the value's position within the
// historical min→max band. A sliver always stays visible (min 4%) so a low
// flow doesn't read as "no data".
export default function DayGauge({ pct, fillClass }) {
  const clamped = Math.max(4, Math.min(100, pct));
  return (
    <span className="gauge">
      <span className={`fill ${fillClass}`} style={{ height: `${clamped}%` }} />
      <span className="ticks" />
    </span>
  );
}
