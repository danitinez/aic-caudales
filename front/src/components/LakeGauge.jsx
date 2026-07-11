import React from 'react';

// Horizontal band: a reservoir's operating range, filled left-to-right from
// bottom to top (min_extraordinary → max_level or crown), with tick marks at
// the normal operating band (min_normal/max_normal) when present.
export default function LakeGauge({ bottom, top, value, minNormal, maxNormal, fillClass }) {
  const range = top - bottom;
  const pct = range > 0 ? Math.max(0, Math.min(1, (value - bottom) / range)) * 100 : 0;

  const tickPct = (level) => {
    if (level === null || level === undefined || range <= 0) return null;
    return Math.max(0, Math.min(1, (level - bottom) / range)) * 100;
  };
  const minTick = tickPct(minNormal);
  const maxTick = tickPct(maxNormal);

  return (
    <div className="lband">
      <span className={`lfill ${fillClass}`} style={{ width: `${pct}%` }} />
      {minTick !== null && <span className="mark" style={{ left: `${minTick}%` }} />}
      {maxTick !== null && <span className="mark" style={{ left: `${maxTick}%` }} />}
    </div>
  );
}
