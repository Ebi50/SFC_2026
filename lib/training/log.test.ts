import { describe, expect, it } from 'vitest';
import { historyStats } from './log';
import type { LogEntry } from './types';

const S = { dur: 20, rest: 45, change: 15 };
const e = (day: string, exerciseId = 'brs', block: LogEntry['block'] = 'main'): LogEntry =>
  ({ day, block, exerciseId, variantIndex: 0, sets: 2, value: 10, unit: 'reps' });

describe('historyStats()', () => {
  it('zählt die Serie bis heute bzw. gestern', () => {
    const entries = [e('2026-10-08'), e('2026-10-09'), e('2026-10-10'), e('2026-10-06')];
    expect(historyStats(entries, '2026-10-10', S).streak).toBe(3);
    expect(historyStats(entries.slice(0, 2), '2026-10-10', S).streak).toBe(2);
    expect(historyStats([e('2026-10-07')], '2026-10-10', S).streak).toBe(0);
  });

  it('summiert Minuten pro Woche (Montag bis Sonntag)', () => {
    const st = historyStats([e('2026-10-05'), e('2026-10-11'), e('2026-10-04')], '2026-10-11', S, 2);
    expect(st.weeks[0].monday).toBe('2026-10-05');
    expect(st.weeks[0].days).toBe(2);
    expect(st.weeks[1].days).toBe(1);
    // brs v0: 2 × 10 × (5+1) s + 1 × 45 s Pause + 15 s Wechsel = 180 s = 3 min
    expect(st.weeks[0].minutes).toBe(6);
  });

  it('zählt Übungen und sortiert absteigend', () => {
    const st = historyStats([e('2026-10-01', 'curl'), e('2026-10-02', 'brs'), e('2026-10-03', 'brs')], '2026-10-10', S);
    expect(st.exercises.map(x => [x.id, x.count])).toEqual([['brs', 2], ['curl', 1]]);
    expect(st.days[0].day).toBe('2026-10-03');
  });
});
