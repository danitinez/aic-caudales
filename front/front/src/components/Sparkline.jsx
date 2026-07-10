import React from 'react';

// Decorative 5-day trend line. The numbers in the day cells carry the actual
// data; this just shows shape at a glance.
export default function Sparkline({ values, todayIndex, className }) {
  const w = 100;
  const h = 24;
  const pad = 3;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = values.map((v, i) => {
    const x = pad + (i / (values.length - 1 || 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return [x, y];
  });

  const path = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const today = points[todayIndex];

  return (
    <svg
      className={className}
      width="70"
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      fill="none"
      aria-hidden="true"
    >
      <path d={path} stroke="currentColor" strokeWidth="1.75" strokeOpacity="0.55" strokeLinecap="round" strokeLinejoin="round" />
      {today && <circle cx={today[0]} cy={today[1]} r="2.5" fill="currentColor" />}
    </svg>
  );
}
