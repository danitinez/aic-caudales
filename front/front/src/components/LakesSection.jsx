import React from 'react';
import LakeGauge from './LakeGauge';
import { AlertTriangleIcon, AlertOctagonIcon, ArrowDownIcon } from './flow.jsx';

const RIVER_BY_ID = {
  alicura: 'Río Limay',
  piedra_del_aguila: 'Río Limay',
  pichi_picun_leufu: 'Río Limay',
  el_chocon: 'Río Limay',
  arroyito: 'Río Limay · Presa compensadora',
  los_barreales: 'Río Neuquén · Cerros Colorados',
  mari_menuco: 'Río Neuquén · Cerros Colorados',
};

// Upstream → downstream per river, mirroring the ordering used for river
// sections in App.jsx.
const DISPLAY_ORDER = [
  'alicura', 'piedra_del_aguila', 'pichi_picun_leufu', 'el_chocon', 'arroyito',
  'los_barreales', 'mari_menuco',
];

const CLASSES = {
  bajo: {
    label: 'Bajo', severity: 'warn', Icon: ArrowDownIcon, reason: 'bajo el mín. normal',
    colors: { text: 'text-alto', bg: 'bg-alto-bg', fill: 'bg-alto' },
  },
  critico: {
    label: 'Crítico', severity: 'danger', Icon: AlertOctagonIcon, reason: 'bajo el mín. extraordinario',
    colors: { text: 'text-muy-alto', bg: 'bg-muy-alto-bg', fill: 'bg-muy-alto' },
  },
  normal: {
    label: 'Normal', severity: 'normal', Icon: null, reason: 'normal',
    colors: { text: 'text-ink', bg: 'bg-medio-bg', fill: 'bg-agua' },
  },
  alto: {
    label: 'Alto', severity: 'warn', Icon: AlertTriangleIcon, reason: 'sobre el máx. normal',
    colors: { text: 'text-alto', bg: 'bg-alto-bg', fill: 'bg-alto' },
  },
  muy_alto: {
    label: 'Muy alto', severity: 'danger', Icon: AlertOctagonIcon, reason: 'sobre el nivel máximo',
    colors: { text: 'text-muy-alto', bg: 'bg-muy-alto-bg', fill: 'bg-muy-alto' },
  },
};

// Single source of truth for reservoir status — mirrors classifyFlow in
// flow.jsx so the whole page reads as one system, but keyed on absolute msnm
// thresholds instead of a historical min/max band.
export function classifyLake(reservoir) {
  const { current_level: v, min_extraordinary: minExt, min_normal: minNorm, max_normal: maxNorm, max_level: maxLvl } = reservoir;

  let key = 'normal';
  if (minExt !== null && v < minExt) key = 'critico';
  else if (minNorm !== null && v < minNorm) key = 'bajo';
  else if (maxLvl !== null && v > maxLvl) key = 'muy_alto';
  else if (maxNorm !== null && v > maxNorm) key = 'alto';

  return { key, ...CLASSES[key] };
}

export default function LakesSection({ lakes }) {
  const reservoirs = lakes.reservoirs.filter(r => r.current_level !== null);
  if (!reservoirs.length) return null;

  const ordered = [...reservoirs].sort((a, b) => {
    const ai = DISPLAY_ORDER.indexOf(a.id);
    const bi = DISPLAY_ORDER.indexOf(b.id);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });

  return (
    <section className="mt-11">
      <div className="flex items-baseline gap-2.5 mb-1">
        <h2 className="font-display font-bold uppercase text-xl tracking-wide text-ink m-0">Embalses</h2>
        <span className="text-xs text-ink-3">
          Nivel del lago en msnm · actualizado{' '}
          {new Date(lakes.last_update + 'T00:00:00').toLocaleDateString('es-ES', {
            day: 'numeric', month: 'long', year: 'numeric',
          })}
        </span>
      </div>

      <div>
        {ordered.map(r => {
          const status = classifyLake(r);
          const c = status.colors;
          const bottom = r.min_extraordinary ?? r.current_level;
          const top = r.max_level ?? r.crown ?? r.current_level;

          return (
            <div key={r.id} className="lake-row grid grid-cols-[150px_1fr_auto] gap-x-4 gap-y-1 items-center py-3 border-b border-hairline last:border-b-0">
              <div>
                <div className="text-ink font-semibold text-sm leading-tight">{r.name}</div>
                <div className="text-ink-3 text-[11.5px]">{RIVER_BY_ID[r.id]}</div>
                {(r.inflow !== null || (r.total_released ?? r.turbined) !== null) && (
                  <div className="text-ink-3 text-xs mt-1.5 space-x-2">
                    {r.inflow !== null && <span>Entrante {r.inflow}</span>}
                    {(r.total_released ?? r.turbined) !== null && (
                      <span>Erogado {r.total_released ?? r.turbined}</span>
                    )}
                  </div>
                )}
              </div>

              <div className="lake-band-cell">
                <LakeGauge
                  bottom={bottom}
                  top={top}
                  value={r.current_level}
                  minNormal={r.min_normal}
                  maxNormal={r.max_normal}
                  fillClass={c.fill}
                />
                <div className="flex justify-between font-mono text-[10px] text-ink-3 mt-1">
                  <span>{bottom}</span>
                  <span>{top}</span>
                </div>
              </div>

              <div className="text-right">
                <div className={`font-display font-bold text-[22px] leading-none tabular-nums ${c.text}`}>
                  {r.current_level}
                </div>
                <div className="text-ink-3 text-[10.5px] mt-0.5 flex items-center justify-end gap-1">
                  {status.Icon && <status.Icon className={c.text} />}
                  msnm · {status.reason}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
