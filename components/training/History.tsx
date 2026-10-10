import React, { useMemo } from 'react';
import type { TrainingSettings } from '../../lib/training/types';
import { historyStats } from '../../lib/training/log';
import { addDays, formatLong, todayIso } from '../../lib/training/dates';
import { LogMap, allEntries } from './trainingStore';

const WEEKS = 8;
const shortDate = (iso: string) => `${Number(iso.slice(8))}.${Number(iso.slice(5, 7))}.`;

const Tile: React.FC<{ label: string; value: string | number; testId?: string }> = ({ label, value, testId }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
    <div className="text-sm text-gray-500">{label}</div>
    <div className="font-display text-3xl font-bold text-secondary tabular-nums" data-testid={testId}>{value}</div>
  </div>
);

export const History: React.FC<{ log: LogMap; settings: TrainingSettings }> = ({ log, settings }) => {
  const today = todayIso();
  const st = useMemo(() => historyStats(allEntries(log), today, settings, WEEKS), [log, today, settings]);
  const maxMin = Math.max(1, ...st.weeks.map(w => w.minutes));
  const doneDays = new Set(st.days.map(d => d.day));
  const calStart = st.weeks[WEEKS - 1].monday;

  if (!st.days.length) {
    return <p className="bg-white rounded-xl border border-gray-200 p-4 text-gray-600">Noch keine erledigten Übungen. Hake Übungen im Tagesplan ab oder starte das Training – dann erscheint hier dein Verlauf.</p>;
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Tile label="Serie (Tage in Folge)" value={st.streak} testId="streak" />
        <Tile label="Minuten diese Woche" value={st.weeks[0].minutes} />
        <Tile label="Trainingstage gesamt" value={st.days.length} />
        <Tile label="Übungen erledigt" value={st.exercises.reduce((a, x) => a + x.count, 0)} />
      </div>

      <section className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <h2 className="font-display text-lg font-semibold text-secondary mb-3">Minuten pro Woche</h2>
        <ul className="flex flex-col gap-1.5">
          {st.weeks.map(w => (
            <li key={w.monday} className="grid grid-cols-[5.5rem_1fr_4rem] items-center gap-2 text-sm" title={`Woche ab ${shortDate(w.monday)}: ${w.minutes} min an ${w.days} Tagen`}>
              <span className="text-gray-500 tabular-nums">ab {shortDate(w.monday)}</span>
              <span className="h-3 bg-gray-100 rounded overflow-hidden"><span className="block h-full bg-primary rounded-r" style={{ width: `${(100 * w.minutes) / maxMin}%` }} /></span>
              <span className="text-right tabular-nums text-secondary">{w.minutes} min</span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-gray-500 mt-2">Geschätzt aus den erledigten Übungen inkl. Pausen und Wechselzeit.</p>
      </section>

      <section className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <h2 className="font-display text-lg font-semibold text-secondary mb-3">Kalender (letzte {WEEKS} Wochen)</h2>
        <div className="grid grid-cols-7 gap-1 max-w-sm text-center text-xs text-gray-500">
          {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(d => <span key={d}>{d}</span>)}
          {Array.from({ length: WEEKS * 7 }, (_, i) => {
            const d = addDays(calStart, i), on = doneDays.has(d), future = d > today;
            return (
              <span
                key={d}
                title={`${formatLong(d)}${on ? ' – trainiert' : ''}`}
                className={`aspect-square rounded flex items-center justify-center tabular-nums
                  ${on ? 'bg-green-600 text-white font-semibold' : future ? 'bg-transparent text-gray-300' : 'bg-gray-100 text-gray-500'}
                  ${d === today ? 'ring-2 ring-primary' : ''}`}
              >
                {Number(d.slice(8))}
              </span>
            );
          })}
        </div>
      </section>

      <div className="grid md:grid-cols-2 gap-4">
        <section className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <h2 className="font-display text-lg font-semibold text-secondary mb-2">Absolvierte Tage</h2>
          <ul className="divide-y divide-gray-100 text-sm">
            {st.days.slice(0, 30).map(d => (
              <li key={d.day} className="flex flex-wrap justify-between gap-x-3 py-1.5">
                <span>{formatLong(d.day)}</span>
                <span className="text-gray-600 tabular-nums">{d.count} Übungen · ca. {d.minutes} min</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <h2 className="font-display text-lg font-semibold text-secondary mb-2">Übungen nach Häufigkeit</h2>
          <ul className="divide-y divide-gray-100 text-sm">
            {st.exercises.map(x => (
              <li key={x.id} className="flex justify-between gap-2 py-1.5">
                <span>{x.name}</span>
                <span className="text-gray-600 tabular-nums shrink-0">{x.count}×</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
};
