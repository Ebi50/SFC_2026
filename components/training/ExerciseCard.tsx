import React from 'react';
import type { PlanItem } from '../../lib/training/types';
import { ExerciseFigures } from './ExerciseFigures';
import { ExerciseDetails, ExerciseTags } from './ExerciseDetails';
import { FEEDBACK_LABEL, doseText } from './format';

interface Props {
  it: PlanItem;
  done: boolean;
  onToggle: () => void;
  onTimer: () => void;
  feedbackLevel?: number;
  onFeedback?: (level: number) => void;
}

const focus = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary';

const FeedbackRow: React.FC<{ level: number; onChange: (l: number) => void; name: string }> = ({ level, onChange, name }) => {
  const opts = [
    { label: 'zu leicht', next: Math.min(2, level + 1) },
    { label: 'passt', next: level },
    { label: 'zu schwer', next: Math.max(-2, level - 1) },
  ];
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm border-t border-gray-100 pt-2" role="group" aria-label={`Rückmeldung zu ${name}`}>
      <span className="text-gray-600">Wie war's?</span>
      {opts.map(o => (
        <button key={o.label} type="button" onClick={() => onChange(o.next)} className={`px-2.5 py-1 rounded-md border border-gray-300 hover:border-primary ${focus}`}>
          {o.label}
        </button>
      ))}
      <span className="text-gray-500">
        Anpassung: <b className="text-secondary">{FEEDBACK_LABEL[level]}</b>
        {level !== 0 && <button type="button" onClick={() => onChange(0)} className={`ml-2 underline text-gray-600 ${focus}`}>zurücksetzen</button>}
      </span>
    </div>
  );
};

export const ExerciseCard: React.FC<Props> = ({ it, done, onToggle, onTimer, feedbackLevel = 0, onFeedback }) => (
  <article
    data-testid={`card-${it.block}-${it.id}`}
    className={`bg-white rounded-xl border p-4 flex flex-col gap-3 shadow-sm ${done ? 'border-green-600 bg-green-50' : 'border-gray-200'}`}
  >
    <ExerciseFigures id={it.id} name={it.ex.name} />
    <div className="flex flex-col gap-1.5 min-w-0">
      <ExerciseTags ex={it.ex} />
      <h3 className="font-display text-xl font-semibold text-secondary leading-tight">{it.ex.name}</h3>
      <div className="font-semibold text-primary">Heute: {it.v.n}</div>
      <div className="font-display text-xl font-semibold tabular-nums">{doseText(it)}</div>
      <ExerciseDetails ex={it.ex} />
      <div className="flex flex-wrap justify-between items-center gap-2 mt-1">
        <button type="button" onClick={onTimer} className={`font-semibold text-primary border border-primary rounded-lg px-3 py-1.5 hover:bg-red-50 ${focus}`}>
          ▶ Timer starten
        </button>
        <button
          type="button"
          onClick={onToggle}
          aria-pressed={done}
          className={`font-semibold rounded-lg px-3 py-1.5 border ${done ? 'bg-green-700 border-green-700 text-white' : 'bg-light border-gray-300 text-secondary'} ${focus}`}
        >
          {done ? '✓ Erledigt' : 'Erledigt?'}
        </button>
      </div>
      {onFeedback && <FeedbackRow level={feedbackLevel} onChange={onFeedback} name={it.ex.name} />}
    </div>
  </article>
);
