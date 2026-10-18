import React, { useCallback, useMemo, useState } from 'react';
import type { Block, PlanItem } from '../../lib/training/types';
import { minutes, plan, planItems } from '../../lib/training/planner';
import { addDays, formatLong, todayIso } from '../../lib/training/dates';
import { TrainingStore, isDone } from './trainingStore';
import { ExerciseCard } from './ExerciseCard';
import { SessionTimer } from './SessionTimer';
import { SettingsPanel } from './SettingsPanel';
import { WeekStrip } from './WeekStrip';
import { TrainingHelp } from './TrainingNotices';
import { unlockAudio } from './audio';

interface Props {
  store: TrainingStore;
  userSeed?: number;
  demo: boolean;
}

const BLOCKS: { key: Block; title: string }[] = [
  { key: 'warm', title: 'Aufwärmen · dynamische Mobilität' },
  { key: 'main', title: 'Hauptteil' },
  { key: 'cool', title: 'Ausklang · Dehnen' },
];
const navBtn = 'font-semibold bg-white border border-gray-300 rounded-lg px-3 py-1.5 hover:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary';

export const TrainingDay: React.FC<Props> = ({ store, userSeed, demo }) => {
  const today = todayIso();
  const [cur, setCur] = useState(today);
  const [session, setSession] = useState<{ day: string; items: PlanItem[] } | null>(null);
  const { settings, cycleStart, feedback, log } = store;

  const planFor = useCallback(
    (day: string) => plan(day, { settings, cycleStart, userSeed, feedback }),
    [settings, cycleStart, userSeed, feedback],
  );
  const p = useMemo(() => planFor(cur), [planFor, cur]);
  const all = planItems(p);
  const doneCount = all.filter(it => isDone(log, cur, it)).length;
  const mins = minutes(p, settings);

  const start = (items: PlanItem[]) => {
    unlockAudio();
    setSession({ day: cur, items });
  };
  const startAll = () => {
    const open = all.filter(it => !isDone(log, cur, it));
    start(open.length ? open : all);
  };
  const startLabel = doneCount === 0 ? `▶ Training starten (${mins} min)`
    : doneCount < all.length ? `▶ Restliche ${all.length - doneCount} Übungen starten` : '▶ Training nochmal starten';

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <button type="button" className={navBtn} onClick={() => setCur(addDays(cur, -1))} aria-label="Vorheriger Tag">‹</button>
          <div className="font-display text-xl font-semibold flex-1 min-w-0" data-testid="training-date">
            {formatLong(cur)}{cur === today ? ' · heute' : ''}
          </div>
          <button type="button" className={navBtn} onClick={() => setCur(today)}>Heute</button>
          <button type="button" className={navBtn} onClick={() => setCur(addDays(cur, 1))} aria-label="Nächster Tag">›</button>
        </div>
        <div className="flex flex-wrap gap-2 text-sm font-semibold">
          <span className="px-2.5 py-0.5 rounded-full bg-red-50 text-primary-dark">{p.cfg.t}</span>
          <span className="px-2.5 py-0.5 rounded-full border border-gray-300 text-gray-600">{p.wk.n}</span>
          <span className="px-2.5 py-0.5 rounded-full border border-gray-300 text-gray-600">ca. {mins} min</span>
        </div>
        <p className="text-gray-600 m-0 max-w-prose">
          {p.cfg.light ? 'Leichter Tag: Beweglichkeit im Vordergrund, Kraftübungen nur locker.' : 'Sauber und kontrolliert vor schwer: lieber eine Wiederholung weniger als eine unsaubere.'}
        </p>
        {p.extraSets && (
          <p className="m-0 max-w-prose text-sm bg-amber-50 border border-amber-200 text-amber-900 rounded-lg px-3 py-2" role="note" data-testid="extra-sets-note">
            Für deine eingestellten {settings.dur} min gibt es an diesem Tag nicht genug passende Übungen. Damit die Dauer erreicht wird, enthält der Hauptteil zusätzliche Sätze. Die Dauer bestimmst du weiterhin über „Gesamtdauer“.
          </p>
        )}
        <div className="h-1.5 bg-gray-200 rounded overflow-hidden" role="progressbar" aria-label="Fortschritt heute" aria-valuemin={0} aria-valuemax={all.length} aria-valuenow={doneCount}>
          <div className="h-full bg-green-600 transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${(100 * doneCount) / all.length}%` }} />
        </div>
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
          <button type="button" onClick={startAll} className="bg-primary hover:bg-primary-dark text-white font-bold text-lg rounded-xl px-5 py-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary">
            {startLabel}
          </button>
          <SettingsPanel settings={settings} onChange={store.setSettings} cycleStart={cycleStart} onCycleStartChange={store.setCycleStart} />
        </div>
      </header>

      {BLOCKS.map(({ key, title }) => p[key].length > 0 && (
        <section key={key} className="flex flex-col gap-3" aria-labelledby={`h-${key}`}>
          <h2 id={`h-${key}`} className="text-2xl font-semibold text-red-600 m-0">{title}</h2>
          {p[key].map(it => (
            <ExerciseCard
              key={`${it.block}:${it.id}`}
              it={it}
              done={isDone(log, cur, it)}
              onToggle={() => store.setDone(cur, it, !isDone(log, cur, it))}
              onTimer={() => start([it])}
              feedbackLevel={feedback[it.id] ?? 0}
              onFeedback={store.setFeedback && (level => store.setFeedback!(it.id, level))}
            />
          ))}
        </section>
      ))}

      <section className="flex flex-col gap-3">
        <h2 className="text-2xl font-semibold text-red-600 m-0">Diese Woche</h2>
        <WeekStrip
          cur={cur}
          today={today}
          onSelect={setCur}
          info={day => {
            const dp = planFor(day), items = planItems(dp);
            return { short: dp.cfg.short, total: items.length, done: items.filter(it => isDone(log, day, it)).length };
          }}
        />
      </section>

      <TrainingHelp demo={demo} />

      {session && (
        <SessionTimer
          items={session.items}
          settings={settings}
          onExerciseDone={it => store.setDone(session.day, it, true)}
          onClose={() => setSession(null)}
        />
      )}
    </div>
  );
};
