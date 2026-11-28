import React from 'react';
import { t } from '../i18n';
import { LAKE_FLOW_FIELDS } from '../optionalFeeds';

const flowFormatter = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 });

export function ReservoirLink({ reservoir }) {
  if (!reservoir.detail_url) return reservoir.name;
  return (
    <a
      className="underline decoration-agua/50 underline-offset-2 hover:text-agua"
      href={reservoir.detail_url} target="_blank" rel="noopener noreferrer"
    >
      {reservoir.name}
    </a>
  );
}

export function ReservoirFlowCard({ reservoir }) {
  return (
    <article className="station">
      <div className="bg-panel border border-hairline rounded-md p-4">
        <h3 className="font-display font-bold uppercase text-[21px] tracking-wide text-ink">
          <ReservoirLink reservoir={reservoir} />
        </h3>
        <p className="mb-2 text-xs text-ink-3">{t('reservoir_flow.reservoir_only')}</p>
        <ReservoirFlows reservoir={reservoir} />
      </div>
    </article>
  );
}

export default function ReservoirFlows({ reservoir, releaseOnly = false }) {
  const fields = (releaseOnly ? ['total_released'] : LAKE_FLOW_FIELDS)
    .filter(field => reservoir[field] != null);
  if (!fields.length) return null;
  return (
    <dl className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-2">
      {fields.map(field => (
        <div key={field}>
          <dt className="inline">{t(`reservoir_flow.${field}`)}</dt>{' '}
          <dd className="inline font-mono font-semibold text-ink tabular-nums">
            {flowFormatter.format(reservoir[field])} m³/s
            {reservoir.flow_times?.[field] && (
              <span className="ml-1 font-sans font-normal text-ink-3">({reservoir.flow_times[field]} h)</span>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
