import React, { useState, useEffect } from 'react';
import RiverSection from './components/RiverSection';
import RiverGlyph from './components/RiverGlyph';
import LakesSection from './components/LakesSection';
import FeedbackForm from './components/FeedbackForm';
import MapView from './components/MapView';
import { RIVER_GROUPS, normalizeId } from './config';
import { t } from './i18n';

function StaffLogo() {
  return (
    <svg width="14" height="30" viewBox="0 0 14 30" fill="none" aria-hidden="true" className="text-agua">
      <rect x="1" y="1" width="12" height="28" rx="2" stroke="currentColor" strokeWidth="2" />
      <line x1="1" y1="8" x2="8" y2="8" stroke="currentColor" strokeWidth="2" />
      <line x1="1" y1="15" x2="11" y2="15" stroke="currentColor" strokeWidth="2" />
      <line x1="1" y1="22" x2="8" y2="22" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function MapIcon({ className }) {
  return (
    <svg className={className} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 3 3.6 5.4a1 1 0 0 0-.6.9v13.2a.5.5 0 0 0 .7.5L9 18l6 3 5.4-2.4a1 1 0 0 0 .6-.9V4.5a.5.5 0 0 0-.7-.5L15 6 9 3z" />
      <path d="M9 3v15M15 6v15" />
    </svg>
  );
}

function ListIcon({ className }) {
  return (
    <svg className={className} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <circle cx="3.5" cy="6" r="1" fill="currentColor" stroke="none" />
      <circle cx="3.5" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="3.5" cy="18" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

const LEGEND = [
  { key: 'bajo', label: 'Bajo', color: 'bg-bajo' },
  { key: 'medio', label: 'Medio', color: 'bg-medio' },
  { key: 'alto', label: 'Alto', color: 'bg-alto' },
  { key: 'muy_alto', label: 'Muy alto', color: 'bg-muy-alto' },
];

function hashToView() {
  return window.location.hash === '#mapa' ? 'map' : 'list';
}

function App() {
  const [data, setData] = useState(null);
  const [minMaxLevels, setMinMaxLevels] = useState(null);
  const [lakes, setLakes] = useState(null);
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState(null);
  const [view, setView] = useState(hashToView);

  useEffect(() => {
    const onHashChange = () => setView(hashToView());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    Promise.all([
      fetch('latest.json').then(r => r.json()),
      fetch('min_max_levels.json').then(r => r.json())
    ]).then(([latestData, minMaxData]) => {
      setData({
        ...latestData,
        sections: latestData.sections.map(s => ({ ...s, id: normalizeId(s.id) })),
      });
      setMinMaxLevels(
        Object.fromEntries(Object.entries(minMaxData).map(([k, v]) => [normalizeId(k), v]))
      );
    }).catch(err => setError(err.message));

    // Lakes and weather are best-effort: their CI scraper steps are
    // continue-on-error, so a missing/broken json must not take down the
    // rest of the site.
    fetch('lakes.json').then(r => r.json()).then(setLakes).catch(() => {});
    fetch('weather.json').then(r => r.json()).then(data => setWeather({
      ...data,
      section_cities: Object.fromEntries(
        Object.entries(data.section_cities ?? {}).map(([k, v]) => [normalizeId(k), v])
      ),
    })).catch(() => {});
  }, []);

  function weatherForSection(sectionId) {
    if (!weather) return null;
    const cityId = weather.section_cities?.[sectionId];
    if (!cityId) return null;
    return weather.cities.find(c => c.city_id === cityId) || null;
  }

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-page text-muy-alto text-sm">
      Error cargando datos: {error}
    </div>
  );
  if (!data || !minMaxLevels) return (
    <div className="min-h-screen flex items-center justify-center gap-3 bg-page text-ink-2 text-sm">
      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
      </svg>
      Cargando datos...
    </div>
  );

  const sectionById = Object.fromEntries(data.sections.map(s => [s.id, s]));
  const groupedIds = new Set(RIVER_GROUPS.flatMap(g => g.ids));
  const otherIds = data.sections.map(s => s.id).filter(id => !groupedIds.has(id));
  const groups = otherIds.length
    ? [...RIVER_GROUPS, { id: 'other', glyph: 'down', ids: otherIds }]
    : RIVER_GROUPS;

  return (
    <div className="min-h-screen bg-page">
      <div className="wrap-narrow max-w-[860px] mx-auto px-5 pb-14">

        <header className="flex items-baseline justify-between gap-4 flex-wrap py-5 border-b border-hairline-strong">
          <div className="flex items-center gap-2.5">
            <StaffLogo />
            <span className="font-display font-bold text-[26px] uppercase tracking-wider leading-none">
              Caudal<span className="text-agua">Guru</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-xs text-ink-2 m-0">
              Actualizado{' '}
              <span className="font-mono">
                {new Date(data.last_update + 'T00:00:00').toLocaleDateString('es-ES', {
                  day: 'numeric', month: 'short', year: 'numeric',
                })}
              </span>
              {' · '}Fuente{' '}
              <a
                href="http://www.aic.gov.ar"
                target="_blank"
                rel="noopener noreferrer"
                className="text-agua underline decoration-agua/30 hover:decoration-agua"
              >
                AIC
              </a>
            </p>
            <button
              type="button"
              onClick={() => { window.location.hash = view === 'map' ? '' : 'mapa'; }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-agua border border-hairline rounded px-2.5 py-1 hover:bg-panel-2"
            >
              {view === 'map' ? <ListIcon /> : <MapIcon />}
              {view === 'map' ? t('ui.list_view') : t('ui.map_view')}
            </button>
          </div>
        </header>

        <div className="mt-4 mb-1.5 max-w-[58ch]">
          <h1 className="text-base font-semibold text-ink m-0">
            Planeá tu ida al río de forma segura
          </h1>
          <p className="text-ink-2 text-[13.5px] mt-1 m-0">
            Caudal programado por la AIC para los próximos días en los ríos Limay,
            Neuquén y Negro. Valores en m³/s, ordenados de aguas arriba hacia aguas abajo.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-x-3.5 gap-y-2 mt-3.5 mb-7 text-xs text-ink-2">
          <span>Respecto al rango histórico de cada tramo:</span>
          {LEGEND.map(item => (
            <span key={item.key} className="inline-flex items-center gap-1.5">
              <span className={`inline-block w-2 h-3.5 rounded-sm ${item.color}`} />
              {item.label}
            </span>
          ))}
        </div>

        <main>
          {view === 'map' ? (
            <MapView
              sections={data.sections}
              minMaxLevels={minMaxLevels}
              weatherForSection={weatherForSection}
            />
          ) : (
            <>
              {groups.map(group => {
                const sections = group.ids.map(id => sectionById[id]).filter(Boolean);
                if (!sections.length) return null;
                const name = group.id === 'other' ? t('ui.other_sections') : t(`rivers.${group.id}.name`);
                const course = group.id === 'other' ? '' : t(`rivers.${group.id}.course`, '');
                return (
                  <section className="river-group" key={group.id}>
                    <div className="flex items-baseline gap-2.5 mb-3 relative">
                      <span className="river-head-glyph absolute -left-[30px] top-0.5 text-agua">
                        <RiverGlyph kind={group.glyph} />
                      </span>
                      <h2 className="font-display font-bold uppercase text-xl tracking-wide text-agua m-0">
                        {name}
                      </h2>
                      {course && <span className="text-xs text-ink-3">{course}</span>}
                    </div>

                    {sections.map(section => (
                      <RiverSection
                        key={section.id}
                        section={section}
                        minMaxLevels={minMaxLevels[section.id]}
                        weather={weatherForSection(section.id)}
                      />
                    ))}
                  </section>
                );
              })}

              {lakes && <LakesSection lakes={lakes} />}

              <div id="opiniones">
                <FeedbackForm />
              </div>
            </>
          )}
        </main>

        <footer className="flex flex-wrap justify-between gap-2.5 mt-11 pt-3.5 border-t border-hairline-strong text-xs text-ink-2">
          <span>
            Fuente:{' '}
            <a
              href="http://www.aic.gov.ar"
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-ink-3/40 hover:decoration-ink-2"
            >
              AIC – Autoridad Interjurisdiccional de las Cuencas
            </a>
          </span>
          <span>
            Hecho por{' '}
            <a
              href="https://develope.ar"
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-ink-3/40 hover:decoration-ink-2"
            >
              develope.ar
            </a>
            {' · '}
            <a
              href="#opiniones"
              className="underline decoration-ink-3/40 hover:decoration-ink-2"
            >
              Enviar opiniones
            </a>
          </span>
        </footer>
      </div>
    </div>
  );
}

export default App;
