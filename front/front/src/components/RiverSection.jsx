import React from 'react';
import Gauge from './Gauge';

const STATUS = {
  normal:  { label: 'Normal',       icon: null,  alert: null },
  warning: { label: 'Caudal bajo',  icon: '⚠️',  alert: 'El caudal se encuentra por debajo del mínimo esperado.' },
  danger:  { label: 'Peligro',      icon: '🚨',  alert: 'El caudal supera el máximo histórico. Extremar precauciones.' },
};

const colorMap = {
  normal:  { border: 'border-emerald-500/30', bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-400', ring: 'ring-emerald-500/40' },
  warning: { border: 'border-amber-500/30',   bg: 'bg-amber-500/10',   text: 'text-amber-400',   dot: 'bg-amber-400',   ring: 'ring-amber-500/40' },
  danger:  { border: 'border-red-500/30',      bg: 'bg-red-500/10',     text: 'text-red-400',     dot: 'bg-red-400',     ring: 'ring-red-500/40' },
};

function sectionDanger(levels, limits) {
  if (!limits) return 'normal';
  let worst = 'normal';
  for (const level of levels) {
    const val = level.type === 'dispensed'
      ? parseFloat(level.dispensed)
      : level.max; // use programmed max for conservative check
    if (val > limits.max) return 'danger';
    if (val < limits.min) worst = 'warning';
  }
  return worst;
}

function levelDanger(level, limits) {
  if (!limits) return 'normal';
  const val = level.type === 'dispensed'
    ? parseFloat(level.dispensed)
    : level.max;
  if (val > limits.max) return 'danger';
  if (val < limits.min) return 'warning';
  return 'normal';
}

function displayValue(level) {
  if (level.type === 'dispensed') return parseFloat(level.dispensed);
  return Math.round((level.min + level.max) / 2);
}

function isToday(dateStr) {
  const now = new Date();
  const d = new Date(dateStr + 'T00:00:00');
  return now.getFullYear() === d.getFullYear() &&
    now.getMonth() === d.getMonth() &&
    now.getDate() === d.getDate();
}

export default function RiverSection({ section, minMaxLevels }) {
  const limits = minMaxLevels || { min: 0, max: 100 };
  const danger = sectionDanger(section.levels, limits);
  const st = STATUS[danger];
  const c = colorMap[danger];

  return (
    <div className={`rounded-2xl p-5 mb-5 border ${c.border} ${c.bg} backdrop-blur-sm`}>

      {/* Section header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-bold text-white leading-tight">{section.title}</h2>
          <p className="text-slate-500 text-xs mt-0.5">
            Rango histórico: <span className="text-slate-400 font-medium">{limits.min}–{limits.max} m³/s</span>
          </p>
        </div>

        {/* Status badge */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-semibold ${c.bg} ${c.border} ${c.text}`}>
          {st.icon && <span className="text-base leading-none">{st.icon}</span>}
          <span className={`w-2 h-2 rounded-full ${c.dot} ${danger !== 'normal' ? 'animate-pulse' : ''}`} />
          {st.label}
        </div>
      </div>

      {/* Alert banner */}
      {st.alert && (
        <div className={`flex items-start gap-2 px-4 py-3 rounded-xl mb-4 border ${c.border} ${c.bg}`}>
          <span className="text-lg leading-none mt-0.5">{st.icon}</span>
          <p className={`text-sm font-medium ${c.text}`}>{st.alert}</p>
        </div>
      )}

      {/* Day cards */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {section.levels.map((level, i) => {
          const val = displayValue(level);
          const d = levelDanger(level, limits);
          const dc = colorMap[d] ?? colorMap.normal;
          const today = isToday(level.date);
          const historical = level.type === 'dispensed';
          const day = new Date(level.date + 'T00:00:00')
            .toLocaleDateString('es-ES', { weekday: 'short' })
            .replace('.', '');

          return (
            <div
              key={i}
              className={`relative flex flex-col items-center rounded-xl py-3 px-2 transition-all
                ${historical
                  ? 'bg-sky-950/70 border border-sky-700/40'
                  : 'bg-slate-800/40 border border-slate-700/30'}
                ${today ? 'ring-2 ring-yellow-400/70' : ''}
                ${d !== 'normal' ? `ring-1 ${dc.ring}` : ''}
              `}
            >
              {today && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-yellow-400 text-slate-900 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide">
                  Hoy
                </span>
              )}

              {/* Day name */}
              <span className={`text-xs font-semibold uppercase tracking-wide mb-2
                ${historical ? 'text-sky-300/80' : 'text-slate-300'}`}>
                {day}
              </span>

              {/* Gauge */}
              <div className="w-full px-1 mb-2">
                <Gauge min={limits.min} max={limits.max} value={val} />
              </div>

              {/* Main value */}
              <span className={`text-xl font-black leading-none
                ${d === 'danger' ? 'text-red-400' : d === 'warning' ? 'text-amber-400' : 'text-white'}`}>
                {val}
              </span>

              {/* Sub-label */}
              {!historical && level.min !== null && (
                <span className="text-[10px] text-slate-500 mt-1 leading-none">
                  {level.min}–{level.max}
                </span>
              )}
              {historical && (
                <span className="text-[10px] text-slate-600 mt-1 leading-none uppercase tracking-wide">
                  real
                </span>
              )}

              {/* Danger tag */}
              {d === 'danger' && (
                <span className="text-[9px] font-bold text-red-400 bg-red-500/20 px-1.5 py-0.5 rounded-full mt-1 uppercase tracking-wide">
                  Excede máx
                </span>
              )}
              {d === 'warning' && (
                <span className="text-[9px] font-bold text-amber-400 bg-amber-500/20 px-1.5 py-0.5 rounded-full mt-1 uppercase tracking-wide">
                  Bajo mín
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex gap-4 mt-4 justify-end">
        <span className="flex items-center gap-1.5 text-[11px] text-slate-500">
          <span className="w-2.5 h-2.5 rounded bg-sky-950/70 border border-sky-700/40" />
          Real (ayer)
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-slate-500">
          <span className="w-2.5 h-2.5 rounded bg-slate-800/40 border border-slate-700" />
          Programado
        </span>
      </div>
    </div>
  );
}
