import React from 'react';

// Maps an AIC "estado" description (and, as a fallback, the icon code's last
// three digits) to one of a small set of condition keys we have icons for.
// AIC's icon catalogue has dozens of codes (drizzle vs. showers vs. steady
// rain, etc.) — we deliberately collapse them into a handful of buckets
// rather than drawing a bespoke icon per code.
const KEYWORD_RULES = [
  [/tormenta/i, 'storm'],
  [/niev|nevada/i, 'snow'],
  [/lluvi|chaparr|llovizna/i, 'rain'],
  [/niebla|neblina/i, 'fog'],
  [/despejado|soleado/i, 'sun'],
  [/parcial/i, 'sun-cloud'],
  [/nublado|cubierto/i, 'cloud'],
];

export function classifyWeather(halfDay) {
  if (!halfDay) return 'cloud';
  const estado = halfDay.estado || '';
  for (const [pattern, key] of KEYWORD_RULES) {
    if (pattern.test(estado)) return key;
  }
  return 'cloud';
}

function SunIcon({ className }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2" x2="12" y2="4" />
      <line x1="12" y1="20" x2="12" y2="22" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="2" y1="12" x2="4" y2="12" />
      <line x1="20" y1="12" x2="22" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function SunCloudIcon({ className }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7" cy="9" r="3" />
      <path d="M14.5 20H8a4 4 0 1 1 .7-7.94 5 5 0 0 1 9.8 1.2A3.5 3.5 0 0 1 18 20h-3.5Z" />
    </svg>
  );
}

function CloudIcon({ className }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.5 19H8a4.5 4.5 0 1 1 .95-8.9 5.5 5.5 0 0 1 10.6 2.2A3.5 3.5 0 0 1 17.5 19Z" />
    </svg>
  );
}

function RainIcon({ className }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 13H8a4.5 4.5 0 1 1 .95-8.9 5.5 5.5 0 0 1 10.6 2.2A3.5 3.5 0 0 1 16 13Z" />
      <line x1="8" y1="16" x2="7" y2="19" />
      <line x1="12" y1="16" x2="11" y2="19" />
      <line x1="16" y1="16" x2="15" y2="19" />
    </svg>
  );
}

function StormIcon({ className }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 11H8a4.5 4.5 0 1 1 .95-8.9 5.5 5.5 0 0 1 10.6 2.2A3.5 3.5 0 0 1 16 11Z" />
      <polyline points="13 13 10 18 13 18 11 22" />
    </svg>
  );
}

function SnowIcon({ className }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 13H8a4.5 4.5 0 1 1 .95-8.9 5.5 5.5 0 0 1 10.6 2.2A3.5 3.5 0 0 1 16 13Z" />
      <line x1="8" y1="17" x2="8" y2="19" />
      <line x1="12" y1="17" x2="12" y2="19" />
      <line x1="16" y1="17" x2="16" y2="19" />
      <line x1="7" y1="18" x2="9" y2="18" />
      <line x1="11" y1="18" x2="13" y2="18" />
      <line x1="15" y1="18" x2="17" y2="18" />
    </svg>
  );
}

function FogIcon({ className }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 10H8a4.5 4.5 0 1 1 .95-8.9 4.5 4.5 0 0 1 8.6 1.3 3.5 3.5 0 0 1-1.55 6.6Z" transform="translate(0 -1)" />
      <line x1="3" y1="16" x2="21" y2="16" />
      <line x1="5" y1="20" x2="19" y2="20" />
    </svg>
  );
}

export function WindIcon({ className }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.59 4.59A2 2 0 1 1 11 8H2" />
      <path d="M12.59 19.41A2 2 0 1 0 14 16H2" />
      <path d="M17.73 7.73A2.5 2.5 0 1 1 19.5 12H2" />
    </svg>
  );
}

const ICONS = {
  sun: SunIcon,
  'sun-cloud': SunCloudIcon,
  cloud: CloudIcon,
  rain: RainIcon,
  storm: StormIcon,
  snow: SnowIcon,
  fog: FogIcon,
};

const COLORS = {
  sun: 'text-alto',
  'sun-cloud': 'text-alto',
  cloud: 'text-ink-3',
  rain: 'text-bajo',
  storm: 'text-bajo',
  snow: 'text-bajo',
  fog: 'text-ink-3',
};

export function WeatherIcon({ halfDay, className }) {
  const key = classifyWeather(halfDay);
  const Icon = ICONS[key];
  return <Icon className={`${COLORS[key]} ${className || ''}`} />;
}
