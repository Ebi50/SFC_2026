import React, { useEffect, useRef } from 'react';
import type { PlanItem, TrainingSettings } from '../../lib/training/types';
import { useSessionTimer } from './useSessionTimer';
import { ExerciseFigures } from './ExerciseFigures';
import { doseText } from './format';

interface Props {
  items: PlanItem[];
  settings: TrainingSettings;
  onExerciseDone: (it: PlanItem) => void;
  onClose: () => void;
}

const BLOCKNAME = { warm: 'Aufwärmen', main: 'Hauptteil', cool: 'Abschluss' } as const;
const PHASE_STYLE = { work: 'bg-primary text-white', rest: 'bg-green-100 text-green-800', intro: 'bg-secondary text-white', switch: 'bg-gray-200 text-gray-800' } as const;
const SUB = { work: 'Halten', rest: 'Locker atmen', intro: 'Position einnehmen, Material bereitlegen', switch: '' } as const;

const fmt = (sec: number) => { const s = Math.max(0, Math.ceil(sec)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
const btn = 'font-semibold rounded-lg border border-gray-300 bg-white text-secondary px-4 py-2.5 hover:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary';

export const SessionTimer: React.FC<Props> = ({ items, settings, onExerciseDone, onClose }) => {
  const t = useSessionTimer(items, settings, ix => onExerciseDone(items[ix]));
  const pauseRef = useRef<HTMLButtonElement>(null);
  const multi = items.length > 1;

  useEffect(() => {
    pauseRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === ' ' && !t.finished) { e.preventDefault(); t.togglePause(); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  const it = t.item;
  const nextText = !t.next ? 'Danach: fertig' : t.next.ix !== t.phase.ix ? `Danach: ${items[t.next.ix].ex.name}` : `Danach: ${t.next.label} (${fmt(t.next.sec)})`;
  const sub = t.finished
    ? (multi ? 'Training beendet – alle durchlaufenen Übungen sind abgehakt.' : 'Übung wurde abgehakt.')
    : t.rep ? `Wiederholung ${t.rep} von ${t.phase.reps}` : SUB[t.phase.kind];

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="t-name" className="fixed inset-0 z-[60] bg-light overflow-y-auto px-4 py-5">
      <div className="max-w-2xl mx-auto flex flex-col items-center gap-3 text-center">
        <div className="w-full flex justify-between text-sm font-semibold text-gray-600">
          <span>{multi ? `Übung ${t.ix + 1} von ${items.length} · ` : ''}{BLOCKNAME[it.block]}</span>
          <span>{t.finished ? '' : `noch ${fmt(t.remaining)}`}</span>
        </div>
        <div className="w-full h-1 bg-gray-200 rounded overflow-hidden"><div className="h-full bg-green-600" style={{ width: `${100 * t.sessionFrac}%` }} /></div>
        <h2 id="t-name" className="font-display text-2xl font-semibold text-secondary">{it.ex.name}</h2>
        <div className="text-primary font-semibold">{it.v.n} · {doseText(it)}</div>
        <ExerciseFigures id={it.id} name={it.ex.name} compact />
        <div className={`font-display uppercase tracking-wider text-xl px-4 py-1 rounded-full ${t.finished ? PHASE_STYLE.rest : PHASE_STYLE[t.phase.kind]}`}>
          {t.finished ? 'Geschafft' : t.phase.label}
        </div>
        <div className="font-display font-bold tabular-nums leading-none text-secondary" style={{ fontSize: 'clamp(4rem, 18vw, 8rem)' }} aria-live="off">
          {t.finished ? '✓' : fmt(t.left)}
        </div>
        <div className="text-gray-600 min-h-[1.5em] text-lg" aria-live="polite">{sub}</div>
        <div className="w-full max-w-md h-2 bg-gray-200 rounded overflow-hidden"><div className="h-full bg-primary" style={{ width: `${100 * t.phaseFrac}%` }} /></div>
        <ol className="list-decimal pl-5 text-left w-full text-gray-600 text-sm space-y-0.5">
          {it.ex.steps.map(s => <li key={s}>{s}</li>)}
        </ol>
        {!t.finished && <div className="text-gray-600">{nextText}</div>}
        <div className="sticky bottom-0 w-full bg-light pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] flex flex-col items-center gap-2">
        <div className="grid grid-cols-4 sm:flex gap-2 w-full sm:w-auto justify-center">
          {multi && <button className={btn} onClick={() => t.jump(-1)} aria-label="Vorherige Übung" disabled={t.finished}>‹ Übung</button>}
          <button ref={pauseRef} className={`${btn} !bg-primary !text-white !border-primary`} onClick={t.finished ? onClose : t.togglePause}>
            {t.finished ? 'Schließen' : t.paused ? 'Fortsetzen' : 'Pause'}
          </button>
          <button className={btn} onClick={t.skip} disabled={t.finished}>Weiter ›</button>
          {multi && <button className={btn} onClick={() => t.jump(1)} aria-label="Nächste Übung" disabled={t.finished}>Übung ›</button>}
        </div>
        <div className="flex gap-2">
          <button className={`${btn} text-sm py-1.5`} onClick={t.toggleSound} aria-pressed={t.soundOn}>Ton: {t.soundOn ? 'an' : 'aus'}</button>
          <button className={`${btn} text-sm py-1.5`} onClick={onClose}>Beenden</button>
        </div>
        </div>
      </div>
    </div>
  );
};
