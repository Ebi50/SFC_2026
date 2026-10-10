import React, { useState } from 'react';
import type { ExerciseType } from '../../lib/training/types';
import { EX, TYPE_LABEL } from '../../lib/training/exercises';
import { ExerciseFigures } from './ExerciseFigures';
import { ExerciseDetails, ExerciseTags } from './ExerciseDetails';
import { rangeText } from './format';

type Filter = 'all' | ExerciseType;
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Alle' },
  ...(['mob', 'str', 'stab'] as const).map(key => ({ key, label: TYPE_LABEL[key] })),
];

export const ExerciseCatalog: React.FC = () => {
  const [filter, setFilter] = useState<Filter>('all');
  const ids = Object.keys(EX).filter(id => filter === 'all' || EX[id].type === filter);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Übungen filtern">
        {FILTERS.map(f => (
          <button
            key={f.key}
            type="button"
            aria-pressed={filter === f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-full border font-semibold text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary
              ${filter === f.key ? 'bg-primary border-primary text-white' : 'bg-white border-gray-300 text-secondary hover:border-primary'}`}
          >
            {f.label}
          </button>
        ))}
        <span className="self-center text-sm text-gray-500 ml-1">{ids.length} Übungen</span>
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        {ids.map(id => {
          const ex = EX[id];
          return (
            <article key={id} className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-2 shadow-sm" data-testid={`catalog-${id}`}>
              <ExerciseFigures id={id} name={ex.name} />
              <ExerciseTags ex={ex} />
              <h3 className="font-display text-xl font-semibold text-secondary leading-tight">{ex.name}</h3>
              <ExerciseDetails ex={ex} />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mt-1">Varianten (Startwerte)</h4>
              <ul className="text-sm space-y-1">
                {ex.v.map(v => (
                  <li key={v.n} className="flex flex-wrap gap-x-2">
                    <span className="font-semibold text-primary-dark">{v.n}</span>
                    <span className="text-gray-600 tabular-nums">{rangeText(v, ex.side)}</span>
                    {v.adv && <span className="text-xs text-gray-500">(schwer – erst ab Woche 2)</span>}
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>
    </div>
  );
};
