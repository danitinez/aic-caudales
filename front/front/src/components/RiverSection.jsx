import React, { useState } from 'react';
import Gauge from './Gauge';
import Sparkline from './Sparkline';
import { classifyFlow, worstClassification, displayValue, ChevronIcon } from './flow.jsx';
import { WeatherIcon, WindIcon } from './weather.jsx';

const SECTION_SUBTITLES = {
  portezuelo_grande:    'Río Neuquén · Entrada al complejo Cerros Colorados',
  el_chanar:            'Río Neuquén · Centenario · Vista Alegre · Cipolletti',
  pichi_picun_leufu:    'Río Limay · Aguas arriba de Arroyito',
  arroyito:             'Río Limay · Senillosa · Plottier · Neuquén',
  'el_chanar_+_arroyito': 'Río Negro · Neuquén · Cipolletti · Allen',
};

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

export default function RiverSection({ section, minMaxLevels, weather }) {
  const [expanded, setExpanded] = useState(null);
  const limits = minMaxLevels || { min: 0, max: 100 };
  const upcomingLevels = section.levels.filter(l => !isPast(l.date));
  const sectionStatus = worstClassification(upcomingLevels, limits);
  const c = sectionStatus.colors;
  const todayIndex = upcomingLevels.findIndex(l => isToday(l.date));

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

        <div className="flex items-center gap-3">
          <Sparkline
            values={upcomingLevels.map(displayValue)}
            todayIndex={todayIndex}
            className={c.text}
          />
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-semibold ${c.bg} ${c.border}`}>
            {sectionStatus.Icon && <sectionStatus.Icon className={`${c.text} leading-none`} />}
            <span className={`w-2 h-2 rounded-full ${c.dot} ${sectionStatus.severity === 'warn' || sectionStatus.severity === 'danger' ? 'animate-pulse' : ''}`} />
            <span className={c.text}>{sectionStatus.label}</span>
          </div>
        </div>
      </div>

      {/* Alert banner */}
      {sectionStatus.alert && (
        <div className={`flex items-start gap-2 px-4 py-3 rounded-xl mb-4 border ${c.border} ${c.bg}`}>
          {sectionStatus.Icon && <sectionStatus.Icon className={`${c.text} mt-0.5 shrink-0`} />}
          <p className={`text-sm font-medium ${c.text}`}>{sectionStatus.alert}</p>
        </div>
      )}

      {/* Day cells */}
      <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
        {upcomingLevels.map((level, i) => {
          const val = displayValue(level);
          const status = classifyFlow(val, limits);
          const dc = status.colors;
          const today = isToday(level.date);
          const isOpen = expanded === i;
          const day = new Date(level.date + 'T00:00:00')
            .toLocaleDateString('es-ES', { weekday: 'short' })
            .replace('.', '');
          const fullDate = new Date(level.date + 'T00:00:00')
            .toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

          return (
            <button
              key={i}
              type="button"
              onClick={() => setExpanded(isOpen ? null : i)}
              aria-expanded={isOpen}
              aria-label={`${fullDate}, ${val} metros cúbicos por segundo, caudal ${status.label.toLowerCase()}`}
              className={`relative flex flex-col items-center rounded-xl py-3 px-1 transition-all
                bg-slate-800/40 border border-slate-700/30
                hover:bg-slate-700/40 active:scale-[0.98]
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60
                ${today ? 'ring-1 ring-slate-300/60' : ''}
                ${isOpen ? 'ring-2 ring-white/40' : ''}
              `}
            >
              {today && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-slate-200 text-slate-900 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide">
                  Hoy
                </span>
              )}

              {/* Day name */}
              <span className="text-xs font-semibold uppercase tracking-wide mb-1.5 text-slate-300">
                {day}
              </span>

              {/* Number — the whole point of the cell */}
              <span className={`font-black leading-none tracking-tight ${dc.text} ${today ? 'text-2xl' : 'text-xl'}`}>
                {val}
              </span>

              <ChevronIcon className={`mt-1.5 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
          );
        })}
      </div>

      {/* Expanded detail panel */}
      {expanded !== null && upcomingLevels[expanded] && (() => {
        const level = upcomingLevels[expanded];
        const val = displayValue(level);
        const status = classifyFlow(val, limits);
        const dc = status.colors;
        const fullDate = new Date(level.date + 'T00:00:00')
          .toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
        const dayForecast = weather?.days.find(d => d.date === level.date);

        return (
          <div
            role="region"
            aria-label={`Detalle para ${fullDate}`}
            className={`mt-3 rounded-xl p-4 border ${dc.border} ${dc.bg}`}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold capitalize text-sm">{fullDate}</h3>
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${dc.bg} ${dc.border} ${dc.text}`}>
                {status.Icon && <status.Icon className="leading-none" />}
                {status.label}
              </div>
            </div>

            {/* Extension point: future rows (clima, UV, viento…) append here */}
            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div className="flex flex-col">
                <dt className="text-slate-500 text-xs">Nivel</dt>
                <dd className="mt-1">
                  <Gauge min={limits.min} max={limits.max} value={val} />
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-slate-500 text-xs">Caudal estimado</dt>
                <dd className={`font-semibold ${dc.text}`}>{val} m³/s</dd>
              </div>
              {level.min !== null && (
                <div className="flex flex-col">
                  <dt className="text-slate-500 text-xs">Rango pronosticado</dt>
                  <dd className="text-slate-300 font-medium">{level.min}–{level.max} m³/s</dd>
                </div>
              )}
              <div className="flex flex-col">
                <dt className="text-slate-500 text-xs">Rango histórico</dt>
                <dd className="text-slate-300 font-medium">{limits.min}–{limits.max} m³/s</dd>
              </div>
              {dayForecast && (
                <div className="flex flex-col">
                  <dt className="text-slate-500 text-xs">Clima ({weather.city_name})</dt>
                  <dd className="flex items-center gap-1.5 text-slate-300 font-medium">
                    <WeatherIcon halfDay={dayForecast.day} />
                    <span>{dayForecast.day.temperature}°&nbsp;/&nbsp;{dayForecast.night.temperature}°</span>
                    <span className="flex items-center gap-0.5 text-slate-400 text-xs ml-1">
                      <WindIcon /> {dayForecast.day.wind} km/h
                    </span>
                  </dd>
                </div>
              )}
            </dl>
          </div>
        );
      })()}
    </div>
  );
}
