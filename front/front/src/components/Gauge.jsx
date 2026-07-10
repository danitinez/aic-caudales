import React, { useId } from 'react';

// Vertical thermometer: fills bottom-up over the historical min→max range,
// using the same scale and color bands as classifyFlow in flow.jsx
// (0-33% blue, 33-66% emerald, 66-80% amber, 80%+ red).
export default function Gauge({ min, max, value }) {
  const uid = useId().replace(/:/g, '');
  const gradientId = `grad-${uid}`;
  const maskId = `mask-${uid}`;

  const svgW = 16;
  const svgH = 72;
  const barW = 8;
  const pad = 4;
  const trackH = svgH - pad * 2;
  const barX = (svgW - barW) / 2;

  const range = max - min;
  const pct = range > 0 ? Math.max(0, Math.min(1, ((value ?? 0) - min) / range)) : 0;
  // Never let the fill collapse to nothing — an empty tube reads as "no data".
  const fillH = Math.max(barW, Math.round(pct * trackH));
  const fillY = pad + trackH - fillH;

  return (
    <div className="flex flex-col items-start leading-none">
      <span className="text-[10px] text-slate-500 tabular-nums">{max}</span>
      <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`} overflow="visible">
        <defs>
          {/* Bottom→top so blue sits at the bottom (low flow). */}
          <linearGradient id={gradientId} x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%"   stopColor="#60a5fa" />
            <stop offset="30%"  stopColor="#60a5fa" />
            <stop offset="36%"  stopColor="#34d399" />
            <stop offset="63%"  stopColor="#34d399" />
            <stop offset="69%"  stopColor="#fbbf24" />
            <stop offset="77%"  stopColor="#fbbf24" />
            <stop offset="83%"  stopColor="#f87171" />
            <stop offset="100%" stopColor="#f87171" />
          </linearGradient>
          <mask id={maskId}>
            <rect x={barX} y={fillY} width={barW} height={fillH} fill="white" />
          </mask>
        </defs>

        {/* Track */}
        <rect x={barX} y={pad} width={barW} height={trackH} rx={barW / 2} fill="#1e293b" />
        {/* Colored fill, clipped to the rounded track shape */}
        <rect x={barX} y={pad} width={barW} height={trackH} rx={barW / 2}
          fill={`url(#${gradientId})`} mask={`url(#${maskId})`} />
        {/* Pointer dot at the fill's top edge */}
        <circle cx={svgW / 2} cy={fillY} r={2.5} fill="white" opacity="0.9" />
      </svg>
      <span className="text-[10px] text-slate-500 tabular-nums">{min}</span>
    </div>
  );
}
