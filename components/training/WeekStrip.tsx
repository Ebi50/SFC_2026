import React from 'react';
import { WDS } from '../../lib/training/schedule';
import { addDays, mondayOf, weekday } from '../../lib/training/dates';

export interface DayInfo { short: string; done: number; total: number }

interface Props {
  cur: string;
  today: string;
  info: (day: string) => DayInfo;
  onSelect: (day: string) => void;
}

export const WeekStrip: React.FC<Props> = ({ cur, today, info, onSelect }) => {
  const monday = mondayOf(cur);
  return (
    <div className="grid grid-cols-7 gap-1.5">
      {Array.from({ length: 7 }, (_, i) => {
        const d = addDays(monday, i), { short, done, total } = info(d);
        const pct = total ? (100 * done) / total : 0;
        return (
          <button
            key={d}
            type="button"
            onClick={() => onSelect(d)}
            aria-current={d === cur ? 'date' : undefined}
            aria-label={`${WDS[weekday(d)]} ${Number(d.slice(8))}., ${short}, ${done} von ${total} erledigt`}
            title={`${done} von ${total} Übungen erledigt`}
            className={`rounded-lg border px-1 py-2 flex flex-col gap-0.5 text-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary
              ${d === cur ? 'bg-red-50' : 'bg-white'} ${d === today ? 'border-primary' : 'border-gray-200'}`}
          >
            <b className="font-display">{WDS[weekday(d)]} {Number(d.slice(8))}.</b>
            <small className="hidden sm:block text-[0.72rem] text-gray-500 leading-tight">{short}</small>
            <span className="h-1.5 rounded mt-1 bg-gray-200 overflow-hidden"><span className="block h-full bg-green-600 rounded" style={{ width: `${pct}%` }} /></span>
          </button>
        );
      })}
    </div>
  );
};
