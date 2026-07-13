import React, { useMemo, useState } from 'react';
import RiverSection, { isPast } from './RiverSection';
import { mapMarkup, VIEWBOXES } from './basinMapMarkup';
import { worstClassification } from './flow.jsx';
import { RIVER_GROUPS } from '../config';
import { t } from '../i18n';

const STATUS_VAR = {
  bajo: 'var(--bajo)',
  medio: 'var(--medio)',
  alto: 'var(--alto)',
  muy_alto: 'var(--muy-alto)',
};

const STATUS_DOT = {
  bajo: 'bg-bajo',
  medio: 'bg-medio',
  alto: 'bg-alto',
  muy_alto: 'bg-muy-alto',
};

export default function MapView({ sections, minMaxLevels, weatherForSection }) {
  const sectionById = useMemo(
    () => Object.fromEntries(sections.map(s => [s.id, s])),
    [sections]
  );

  const statusById = useMemo(() => {
    const out = {};
    for (const section of sections) {
      const limits = minMaxLevels[section.id];
      const upcoming = section.levels.filter(l => !isPast(l.date));
      out[section.id] = worstClassification(upcoming, limits).key;
    }
    return out;
  }, [sections, minMaxLevels]);

  const statusColors = useMemo(
    () => Object.fromEntries(
      Object.entries(statusById).map(([id, key]) => [id, STATUS_VAR[key]])
    ),
    [statusById]
  );

  const selectableIds = useMemo(
    () => RIVER_GROUPS.flatMap(g => g.ids).filter(id => VIEWBOXES[id] && sectionById[id]),
    [sectionById]
  );

  const [selectedId, setSelectedId] = useState(selectableIds[0] ?? null);

  const mapSvg = useMemo(
    () => mapMarkup(selectedId, { statusColors }),
    [selectedId, statusColors]
  );

  function handleMapClick(e) {
    const hit = e.target.closest('.tramo-hit');
    if (hit?.dataset.section) setSelectedId(hit.dataset.section);
  }

  const selectedSection = selectedId ? sectionById[selectedId] : null;

  return (
    <div>
      <div className="bg-panel border border-hairline rounded-md p-3 mb-1">
        <p className="text-xs text-ink-2 mb-2">
          {t('ui.map_hint')}
        </p>
        <div
          className="basin-interactive"
          onClick={handleMapClick}
          dangerouslySetInnerHTML={{ __html: mapSvg }}
        />
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-3 my-4">
        {RIVER_GROUPS.map(group => {
          const ids = group.ids.filter(id => selectableIds.includes(id));
          if (!ids.length) return null;
          return (
            <div key={group.id} className="flex flex-col gap-1.5">
              <h3 className="text-[11px] uppercase tracking-wide text-ink-3 font-semibold m-0">
                {t(`rivers.${group.id}.name`)}
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {ids.map(id => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setSelectedId(id)}
                    aria-pressed={selectedId === id}
                    className={`inline-flex items-center gap-1.5 text-xs border rounded px-2 py-1
                      ${selectedId === id ? 'border-agua bg-panel-2' : 'border-hairline hover:bg-panel-2'}`}
                  >
                    <span className={`inline-block w-1.5 h-1.5 rounded-full ${STATUS_DOT[statusById[id]]}`} />
                    {t(`sections.${id}.title`)}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {selectedSection && (
        <RiverSection
          section={selectedSection}
          minMaxLevels={minMaxLevels[selectedSection.id]}
          weather={weatherForSection(selectedSection.id)}
        />
      )}
    </div>
  );
}
