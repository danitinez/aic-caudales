import React, { useId } from 'react';

// Vertical tank: a reservoir cross-section, filled bottom-up from
// min_extraordinary to max_level (or crown), with dashed tick lines at the
// normal operating band (min_normal/max_normal) when the reservoir has them.
export default function LakeGauge({ bottom, top, value, minNormal, maxNormal, colorClass }) {
  const uid = useId().replace(/:/g, '');
  const clipId = `tank-clip-${uid}`;

  const svgW = 56;
  const svgH = 96;
  const pad = 6;
  const tankW = svgW - pad * 2;
  const tankH = svgH - pad * 2;
  const tankX = pad;
  const tankY = pad;
  const rx = 6;

  const range = top - bottom;
  const pct = range > 0 ? Math.max(0, Math.min(1, (value - bottom) / range)) : 0;
  const fillH = pct * tankH;
  const fillY = tankY + tankH - fillH;

  const tickY = (level) => {
    if (level === null || level === undefined || range <= 0) return null;
    const p = Math.max(0, Math.min(1, (level - bottom) / range));
    return tankY + tankH - p * tankH;
  };
  const minTickY = tickY(minNormal);
  const maxTickY = tickY(maxNormal);

  const fill = {
    'text-blue-400': '#60a5fa',
    'text-emerald-400': '#34d399',
    'text-amber-400': '#fbbf24',
    'text-red-400': '#f87171',
  }[colorClass] || '#34d399';

  return (
    <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`} className="shrink-0">
      <defs>
        <clipPath id={clipId}>
          <rect x={tankX} y={tankY} width={tankW} height={tankH} rx={rx} />
        </clipPath>
      </defs>

      {/* Tank outline */}
      <rect x={tankX} y={tankY} width={tankW} height={tankH} rx={rx} fill="#1e293b" stroke="#334155" strokeWidth="1" />

      {/* Water fill, clipped to the rounded tank */}
      <g clipPath={`url(#${clipId})`}>
        <rect x={tankX} y={fillY} width={tankW} height={fillH} fill={fill} fillOpacity="0.55" />
        {/* Water surface line */}
        <rect x={tankX} y={fillY} width={tankW} height="2" fill={fill} fillOpacity="0.9" />
      </g>

      {/* Operating band ticks */}
      {minTickY !== null && (
        <line x1={tankX} y1={minTickY} x2={tankX + tankW} y2={minTickY}
          stroke="#94a3b8" strokeWidth="1" strokeDasharray="2,2" opacity="0.7" />
      )}
      {maxTickY !== null && (
        <line x1={tankX} y1={maxTickY} x2={tankX + tankW} y2={maxTickY}
          stroke="#94a3b8" strokeWidth="1" strokeDasharray="2,2" opacity="0.7" />
      )}
    </svg>
  );
}
