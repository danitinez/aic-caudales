import React, { useState } from 'react';
import DayGauge from './DayGauge';
import { classifyFlow, worstClassification, worstDaysLabel, displayValue, ChevronIcon } from './flow.jsx';
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
  const chipLabel = worstDaysLabel(upcomingLevels, limits);
  const c = sectionStatus.colors;
  const ChipIcon = sectionStatus.chipIcon;

  return (
    <article className="station">
      <div className="bg-panel border border-hairline rounded-md p-4">

        {/* Section header */}
        <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
          <div>
            <h3 className="font-display font-bold uppercase text-[21px] tracking-wide leading-tight text-ink">
              {section.title}
            </h3>
            {SECTION_SUBTITLES[section.id] && (
              <p className="text-ink-2 text-xs mt-0.5">{SECTION_SUBTITLES[section.id]}</p>
            )}
            <p className="font-mono text-[11px] text-ink-3 mt-0.5">
              Rango histórico <span className="tabular-nums">{limits.min}–{limits.max} m³/s</span>
            </p>
          </div>

          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold ${c.text} ${c.bg}`}>
            {ChipIcon && <ChipIcon className="leading-none" />}
            {chipLabel}
          </span>
        </div>

        {/* Alert banner */}
        {sectionStatus.alert && (
          <div className={`flex items-start gap-2 px-3 py-2.5 rounded mb-3 ${c.bg}`}>
            {sectionStatus.Icon && <sectionStatus.Icon className={`${c.text} mt-0.5 shrink-0`} />}
            <p className={`text-sm font-medium ${c.text}`}>{sectionStatus.alert}</p>
          </div>
        )}

        {/* Day cells */}
        <div
          className="grid gap-2"
          style={{ gridTemplateColumns: `repeat(${upcomingLevels.length}, minmax(0, 1fr))` }}
        >
          {upcomingLevels.map((level, i) => {
            const val = displayValue(level);
            const status = classifyFlow(val, limits);
            const dc = status.colors;
            const today = isToday(level.date);
            const isOpen = expanded === i;
            const range = limits.max - limits.min;
            const pct = range > 0 ? ((val - limits.min) / range) * 100 : 50;
            const day = new Date(level.date + 'T00:00:00')
              .toLocaleDateString('es-ES', { weekday: 'short' })
              .replace('.', '');
            const dayNum = new Date(level.date + 'T00:00:00').getDate();
            const fullDate = new Date(level.date + 'T00:00:00')
              .toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

            return (
              <button
                key={i}
                type="button"
                onClick={() => setExpanded(isOpen ? null : i)}
                aria-expanded={isOpen}
                aria-label={`${fullDate}, ${val} metros cúbicos por segundo, caudal ${status.label.toLowerCase()}`}
                className={`relative flex min-w-0 flex-col items-center rounded py-2.5 px-1 border transition-colors
                  bg-panel border-hairline hover:bg-panel-2
                  ${today ? 'border-hairline-strong' : ''}
                  ${isOpen ? 'border-agua bg-panel-2' : ''}
                `}
              >
                {today && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-ink text-page text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wide">
                    Hoy
                  </span>
                )}

                <span className="font-display uppercase text-[13px] tracking-widest text-ink-2 mb-1">
                  {day} {dayNum}
                </span>

                <span className={`day-val font-display font-bold text-3xl leading-none tabular-nums ${dc.text}`}>
                  {val}
                </span>

                <DayGauge pct={pct} fillClass={dc.fill} />

                <ChevronIcon className={`mt-1.5 text-ink-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>
            );
          })}
        </div>

        {/* Expanded detail panel */}
        {expanded !== null && upcomingLevels[expanded] && (() => {
          const level = upcomingLevels[expanded];
          const val = displayValue(level);
          const fullDate = new Date(level.date + 'T00:00:00')
            .toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
          const dayForecast = weather?.days.find(d => d.date === level.date);

          return (
            <div
              role="region"
              aria-label={`Detalle para ${fullDate}`}
              className="mt-3 bg-panel-2 border border-hairline rounded p-3 text-[12.5px] text-ink-2 flex flex-wrap gap-x-6 gap-y-1"
            >
              <span className="font-semibold text-ink capitalize">{fullDate}</span>
              <span>Estimado <b className="text-ink font-mono">{val} m³/s</b></span>
              {level.min !== null && (
                <span>Pronosticado <span className="font-mono">{level.min}–{level.max} m³/s</span></span>
              )}
              <span>Histórico <span className="font-mono">{limits.min}–{limits.max} m³/s</span></span>
              {dayForecast && (
                <span className="flex items-center gap-1.5">
                  <WeatherIcon halfDay={dayForecast.day} />
                  <span className="font-mono">{dayForecast.day.temperature}°&nbsp;/&nbsp;{dayForecast.night.temperature}°</span>
                  <span className="flex items-center gap-0.5 text-ink-3">
                    <WindIcon /> {dayForecast.day.wind} km/h
                  </span>
                </span>
              )}
            </div>
          );
        })()}
      </div>
    </article>
  );
}
