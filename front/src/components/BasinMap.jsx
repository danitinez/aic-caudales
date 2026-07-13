import React, { useEffect, useMemo, useRef, useState } from 'react';
import { VIEWBOXES, mapMarkup } from './basinMapMarkup';
import { t } from '../i18n';

function MapModal({ sectionId, onClose }) {
  const [full, setFull] = useState(false);
  const closeRef = useRef(null);
  const markup = useMemo(() => mapMarkup(sectionId, { zoom: !full }), [sectionId, full]);
  const title = t(`sections.${sectionId}.title`, sectionId);

  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div
      className="basin-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={`Mapa del tramo ${title}`}
      onClick={onClose}
    >
      <div
        className="basin-modal bg-panel border border-hairline rounded-md"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 px-4 pt-3 pb-2">
          <div>
            <h4 className="font-display font-bold uppercase text-base tracking-wide text-ink m-0 leading-tight">
              {title}
            </h4>
            <p className="text-xs text-ink-2 m-0 mt-0.5">
              Tramo resaltado sobre la cuenca
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Cerrar mapa"
            className="text-ink-2 hover:text-ink text-xl leading-none px-1"
          >
            ×
          </button>
        </div>

        <div
          className={`basin-modal-map ${full ? '' : 'is-zoomed'}`}
          dangerouslySetInnerHTML={{ __html: markup }}
        />

        <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-t border-hairline">
          <button
            type="button"
            onClick={() => setFull(!full)}
            className="text-xs font-semibold text-agua underline decoration-agua/30 hover:decoration-agua"
          >
            {full ? 'Acercar al tramo' : 'Ver cuenca completa'}
          </button>
          <span className="text-[10px] text-ink-3">
            Geometría © OpenStreetMap
          </span>
        </div>
      </div>
    </div>
  );
}

// Small clickable thumbnail of the basin with the section's stretch
// highlighted; opens a zoomable modal. Renders nothing for section ids
// without a stretch on the map (e.g. future "other" sections).
export default function BasinMiniMap({ sectionId }) {
  const [open, setOpen] = useState(false);
  const mini = useMemo(() => mapMarkup(sectionId), [sectionId]);
  if (!VIEWBOXES[sectionId]) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="basin-mini"
        aria-label={`Ver en el mapa: ${t(`sections.${sectionId}.title`, sectionId)}`}
        title="Ver en el mapa"
      >
        <span aria-hidden="true" dangerouslySetInnerHTML={{ __html: mini }} />
      </button>
      {open && <MapModal sectionId={sectionId} onClose={() => setOpen(false)} />}
    </>
  );
}
