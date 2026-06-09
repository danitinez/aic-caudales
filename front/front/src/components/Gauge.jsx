import React, { useId } from 'react';

export default function Gauge({ min, max, value }) {
  const uid = useId().replace(/:/g, '');
  const gradientId = `grad-${uid}`;
  const maskId = `mask-${uid}`;

  const padding = 6;
  const barH = 6;
  const svgH = 20;
  const svgW = 90;
  const trackW = svgW - padding * 2;
  const barY = (svgH - barH) / 2;

  const clamped = Math.max(min, Math.min(max, value ?? min));
  const pct = max > min ? (clamped - min) / (max - min) : 0;
  const fillW = Math.round(pct * trackW);
  const pointerX = padding + fillW;

  return (
    <svg width="100%" viewBox={`0 0 ${svgW} ${svgH}`} overflow="visible">
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#22c55e" />
          <stop offset="50%"  stopColor="#eab308" />
          <stop offset="100%" stopColor="#ef4444" />
        </linearGradient>
        <mask id={maskId}>
          <rect x={padding} y={barY} width={fillW} height={barH} rx={barH / 2} fill="white" />
        </mask>
      </defs>

      {/* Track */}
      <rect x={padding} y={barY} width={trackW} height={barH} rx={barH / 2} fill="#1e293b" />
      {/* Colored fill */}
      <rect x={padding} y={barY} width={trackW} height={barH} rx={barH / 2}
        fill={`url(#${gradientId})`} mask={`url(#${maskId})`} />
      {/* Pointer dot */}
      <circle cx={pointerX} cy={barY - 2} r={3.5} fill="white" opacity="0.9" />
    </svg>
  );
}
