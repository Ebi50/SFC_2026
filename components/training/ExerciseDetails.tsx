import React from 'react';
import type { Exercise } from '../../lib/training/types';
import { ORG_LABEL, TYPE_LABEL } from '../../lib/training/exercises';

const h4 = 'text-xs font-semibold uppercase tracking-wider text-gray-500 mt-2 mb-0.5';

export const ExerciseTags: React.FC<{ ex: Exercise }> = ({ ex }) => (
  <div className="flex flex-wrap gap-1.5">
    <span className="text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-red-50 text-primary-dark">{ORG_LABEL[ex.org]}</span>
    <span className="text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border border-gray-300 text-gray-600">{TYPE_LABEL[ex.type]}</span>
  </div>
);

/** Wofür, Muskeln, Schritte, „Achte auf“ und typische Fehler */
export const ExerciseDetails: React.FC<{ ex: Exercise }> = ({ ex }) => (
  <div className="text-[0.97rem] text-secondary">
    <p className="my-0.5"><b>Wofür:</b> {ex.goal}</p>
    <p className="text-sm text-gray-500 my-0.5">Muskeln: {ex.musc}</p>
    <h4 className={h4}>So geht's</h4>
    <ol className="list-decimal pl-5 space-y-0.5">{ex.steps.map(s => <li key={s}>{s}</li>)}</ol>
    <div className="grid sm:grid-cols-2 gap-3">
      <div>
        <h4 className={h4}>Achte auf</h4>
        <ul className="list-disc pl-5 text-gray-600 text-sm">{ex.cues.map(s => <li key={s}>{s}</li>)}</ul>
      </div>
      <div>
        <h4 className={h4}>Typische Fehler</h4>
        <ul className="list-disc pl-5 text-gray-600 text-sm marker:text-primary">{ex.errs.map(s => <li key={s}>{s}</li>)}</ul>
      </div>
    </div>
  </div>
);
