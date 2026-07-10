import React from 'react';
import LakeGauge from './LakeGauge';
import { AlertTriangleIcon, AlertOctagonIcon } from './flow.jsx';

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
    label: 'Bajo', severity: 'warn', Icon: AlertTriangleIcon,
    colors: { text: 'text-amber-400', border: 'border-amber-500/30', bg: 'bg-amber-500/10', dot: 'bg-amber-400' },
  },
  critico: {
    label: 'Crítico', severity: 'danger', Icon: AlertOctagonIcon,
    colors: { text: 'text-red-400', border: 'border-red-500/30', bg: 'bg-red-500/10', dot: 'bg-red-400' },
  },
  normal: {
    label: 'Normal', severity: 'normal', Icon: null,
    colors: { text: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500/10', dot: 'bg-emerald-400' },
  },
  alto: {
    label: 'Alto', severity: 'warn', Icon: AlertTriangleIcon,
    colors: { text: 'text-amber-400', border: 'border-amber-500/30', bg: 'bg-amber-500/10', dot: 'bg-amber-400' },
  },
  muy_alto: {
    label: 'Muy alto', severity: 'danger', Icon: AlertOctagonIcon,
    colors: { text: 'text-red-400', border: 'border-red-500/30', bg: 'bg-red-500/10', dot: 'bg-red-400' },
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
    <section className="mt-12">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-white tracking-tight">Embalses</h2>
        <p className="text-slate-500 text-xs mt-1">
          Nivel de los lagos · msnm · Datos actualizados:{' '}
          {new Date(lakes.last_update + 'T00:00:00').toLocaleDateString('es-ES', {
            day: 'numeric', month: 'long', year: 'numeric',
          })}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ordered.map(r => {
          const status = classifyLake(r);
          const c = status.colors;
          const bottom = r.min_extraordinary ?? r.current_level;
          const top = r.max_level ?? r.crown ?? r.current_level;
          const range = top - bottom;
          const pct = range > 0 ? Math.round(Math.max(0, Math.min(1, (r.current_level - bottom) / range)) * 100) : null;

          return (
            <div key={r.id} className={`rounded-2xl p-4 border ${c.border} ${c.bg} backdrop-blur-sm flex gap-4`}>
              <LakeGauge
                bottom={bottom}
                top={top}
                value={r.current_level}
                minNormal={r.min_normal}
                maxNormal={r.max_normal}
                colorClass={c.text}
              />

              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex flex-col gap-1.5">
                  <div className={`self-start flex items-center gap-1 px-2 py-1 rounded-full border text-xs font-semibold ${c.bg} ${c.border}`}>
                    {status.Icon && <status.Icon className={`${c.text} leading-none`} />}
                    <span className={`w-1.5 h-1.5 rounded-full ${c.dot} ${status.severity === 'warn' || status.severity === 'danger' ? 'animate-pulse' : ''}`} />
                    <span className={c.text}>{status.label}</span>
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-sm leading-tight">{r.name}</h3>
                    <p className="text-slate-500 text-xs mt-0.5">{RIVER_BY_ID[r.id]}</p>
                  </div>
                </div>

                <div className="mt-2">
                  <span className={`font-black text-xl leading-none tracking-tight ${c.text}`}>
                    {r.current_level}
                  </span>
                  <span className="text-slate-500 text-xs ml-1">msnm{pct !== null ? ` · ${pct}%` : ''}</span>
                </div>

                <div className="text-slate-500 text-xs mt-2 space-x-2">
                  {r.inflow !== null && <span>Entrante {r.inflow}</span>}
                  {(r.total_released ?? r.turbined) !== null && (
                    <span>Erogado {r.total_released ?? r.turbined}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
