import React from 'react';
import Gauge from './Gauge';

const SECTION_SUBTITLES = {
  portezuelo_grande:    'Río Neuquén · Entrada al complejo Cerros Colorados',
  el_chanar:            'Río Neuquén · Centenario · Vista Alegre · Cipolletti',
  pichi_picun_leufu:    'Río Limay · Aguas arriba de Arroyito',
  arroyito:             'Río Limay · Senillosa · Plottier · Neuquén',
  'el_chanar_+_arroyito': 'Río Negro · Neuquén · Cipolletti · Allen',
};

const STATUS = {
  normal:  { label: 'Medio',        icon: null,  alert: null },
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
    const val = level.max;
    if (val > limits.max) return 'danger';
    if (val < limits.min) worst = 'warning';
  }
  return worst;
}

function sectionFlowLabel(levels, limits) {
  if (!limits || !levels.length) return flowLabel(0, limits);
  const avg = levels.reduce((sum, l) => sum + displayValue(l), 0) / levels.length;
  return flowLabel(avg, limits);
}

function levelDanger(level, limits) {
  if (!limits) return 'normal';
  const val = level.max;
  if (val > limits.max) return 'danger';
  if (val < limits.min) return 'warning';
  return 'normal';
}

function displayValue(level) {
  return Math.round((level.min + level.max) / 2);
}

function flowLabel(val, limits) {
  if (!limits) return { text: 'Normal', color: 'text-emerald-400', icon: null };
  const { min, max } = limits;
  const range = max - min;
  if (val < min - range * 0.1)  return { text: 'Muy bajo', color: 'text-sky-400',     icon: '⚠️' };
  if (val < min)                return { text: 'Bajo',     color: 'text-amber-400',   icon: null };
  if (val < min + range * 0.40) return { text: 'Medio',    color: 'text-emerald-400', icon: null };
  if (val < min + range * 0.75) return { text: 'Alto',     color: 'text-orange-400',  icon: '⚠️' };
                                return { text: 'Muy alto', color: 'text-red-400',     icon: '🚨' };
}

function isToday(dateStr) {
  const now = new Date();
  const d = new Date(dateStr + 'T00:00:00');
  return now.getFullYear() === d.getFullYear() &&
    now.getMonth() === d.getMonth() &&
    now.getDate() === d.getDate();
}

// A level is "past" if its date falls before today. We filter by date rather
// than by level.type, because when AIC's data lags a day or two the programmed
// levels can include dates that are already in the past.
function isPast(dateStr) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const d = new Date(dateStr + 'T00:00:00');
  return d < today;
}

export default function RiverSection({ section, minMaxLevels }) {
  const limits = minMaxLevels || { min: 0, max: 100 };
  const upcomingLevels = section.levels.filter(l => !isPast(l.date));
  const danger = sectionDanger(upcomingLevels, limits);
  const st = STATUS[danger];
  const c = colorMap[danger];
  const sectionLabel = sectionFlowLabel(upcomingLevels, limits);

  return (
    <div className={`rounded-2xl p-5 mb-5 border ${c.border} ${c.bg} backdrop-blur-sm`}>

      {/* Section header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-bold text-white leading-tight">{section.title}</h2>
          {SECTION_SUBTITLES[section.id] && (
            <p className="text-slate-400 text-xs mt-0.5">{SECTION_SUBTITLES[section.id]}</p>
          )}
          <p className="text-slate-600 text-xs mt-0.5">
            Rango histórico: <span className="text-slate-500 font-medium">{limits.min}–{limits.max} m³/s</span>
          </p>
        </div>

        {/* Status badge — promedio de niveles */}
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-semibold ${c.bg} ${c.border}`}>
          {sectionLabel.icon && <span className="text-sm leading-none">{sectionLabel.icon}</span>}
          <span className={`w-2 h-2 rounded-full ${c.dot} ${danger !== 'normal' ? 'animate-pulse' : ''}`} />
          <span className={sectionLabel.color}>{sectionLabel.text}</span>
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
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {upcomingLevels.map((level, i) => {
          const val = displayValue(level);
          const d = levelDanger(level, limits);
          const dc = colorMap[d] ?? colorMap.normal;
          const label = flowLabel(val, limits);
          const today = isToday(level.date);
          const day = new Date(level.date + 'T00:00:00')
            .toLocaleDateString('es-ES', { weekday: 'short' })
            .replace('.', '');

          return (
            <div
              key={i}
              className={`relative flex flex-col items-center rounded-xl py-3 px-2 transition-all
                bg-slate-800/40 border border-slate-700/30
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
              <span className="text-xs font-semibold uppercase tracking-wide mb-2 text-slate-300">
                {day}
              </span>

              {/* Gauge */}
              <div className="w-full px-1 mb-2">
                <Gauge min={limits.min} max={limits.max} value={val} />
              </div>

              {/* Label — protagonista */}
              <span className={`flex items-center gap-1 text-sm font-black leading-none tracking-wide ${label.color}`}>
                {label.icon && <span className="text-xs leading-none">{label.icon}</span>}
                {label.text}
              </span>

              {/* Number — secundario */}
              <span className="text-xs text-slate-500 mt-1 leading-none font-medium">
                {val} m³/s
              </span>

              {/* Min-max range */}
              {level.min !== null && (
                <span className="text-[10px] text-slate-600 mt-0.5 leading-none">
                  {level.min}–{level.max}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
