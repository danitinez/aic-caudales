import React, { useState } from 'react';
import DayGauge from './DayGauge';
import BasinMiniMap from './BasinMap';
import { classifyFlow, worstClassification, worstDaysLabel, displayValue, ChevronIcon } from './flow.jsx';
import { WeatherIcon, WindIcon } from './weather.jsx';
import { t } from '../i18n';

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
export function isPast(dateStr) {
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
              {t(`sections.${section.id}.title`, section.title)}
            </h3>
            {t(`sections.${section.id}.subtitle`, '') && (
              <p className="text-ink-2 text-xs mt-0.5">{t(`sections.${section.id}.subtitle`, '')}</p>
            )}
            <p className="font-mono text-[11px] text-ink-3 mt-0.5">
              Rango histórico <span className="tabular-nums">{limits.min}–{limits.max} m³/s</span>
            </p>
          </div>

          <div className="flex items-start gap-2.5">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold ${c.text} ${c.bg}`}>
              {ChipIcon && <ChipIcon className="leading-none" />}
              {chipLabel}
            </span>
            <BasinMiniMap sectionId={section.id} />
          </div>
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
            const dayForecast = weather?.days.find(d => d.date === level.date);
            const maxWind = dayForecast ? Math.max(dayForecast.day.wind, dayForecast.night.wind) : null;
            const weatherLabel = dayForecast
              ? `, máxima ${dayForecast.day.temperature}°, mínima ${dayForecast.night.temperature}°, viento ${maxWind} km/h`
              : '';

            return (
              <button
                key={i}
                type="button"
                onClick={() => setExpanded(isOpen ? null : i)}
                aria-expanded={isOpen}
                aria-label={`${fullDate}, ${val} metros cúbicos por segundo, caudal ${status.label.toLowerCase()}${weatherLabel}`}
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

                {dayForecast ? (
                  <div className="flex flex-col items-center gap-0.5 mt-1.5">
                    <WeatherIcon halfDay={dayForecast.day} className="w-4 h-4" />
                    <span className="font-mono text-[10px] tabular-nums text-ink-2 leading-none">
                      {dayForecast.day.temperature}°/{dayForecast.night.temperature}°
                    </span>
                    <span className="flex items-center gap-0.5 font-mono text-[10px] tabular-nums text-ink-3 leading-none">
                      <WindIcon className="w-3 h-3" /> {maxWind}
                    </span>
                  </div>
                ) : (
                  <div className="h-[38px]" />
                )}

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
              className="mt-3 bg-panel-2 border border-hairline rounded p-3 text-[12.5px] text-ink-2 flex flex-col gap-2"
            >
              <div className="flex flex-wrap gap-x-6 gap-y-1">
                <span className="font-semibold text-ink capitalize">{fullDate}</span>
                <span>Estimado <b className="text-ink font-mono">{val} m³/s</b></span>
                {level.min !== null && (
                  <span>Pronosticado <span className="font-mono">{level.min}–{level.max} m³/s</span></span>
                )}
                <span>Histórico <span className="font-mono">{limits.min}–{limits.max} m³/s</span></span>
              </div>

              {dayForecast && (
                <div className="flex flex-wrap gap-x-6 gap-y-1.5 pt-2 border-t border-hairline">
                  {dayForecast.day.estado && (
                    <span className="w-full text-ink-3">Pronóstico en {weather.city_name}</span>
                  )}
                  {[
                    { label: 'Día', halfDay: dayForecast.day },
                    { label: 'Noche', halfDay: dayForecast.night },
                  ].map(({ label, halfDay }) => (
                    <span key={label} className="flex items-center gap-1.5">
                      <span className="text-ink-3">{label}</span>
                      <WeatherIcon halfDay={halfDay} />
                      <span className="font-mono">{halfDay.temperature}°</span>
                      <span>{halfDay.estado}</span>
                      <span className="flex items-center gap-0.5 text-ink-3">
                        <WindIcon /> {halfDay.wind} km/h ({halfDay.direction}, ráfagas {halfDay.gusts})
                      </span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </article>
  );
}
