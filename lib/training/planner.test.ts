import { describe, expect, it } from 'vitest';
import { cycle, itemSec, minutes, plan, planItems } from './planner';
import { addDays, weekday } from './dates';
import { DAYS } from './schedule';
import type { PlanOptions } from './types';

const START = '2026-01-05';
const opts = (dur = 20, extra: Partial<PlanOptions> = {}): PlanOptions => ({
  settings: { dur, rest: 45, change: 15 }, cycleStart: START, ...extra,
});
const days = (n: number, from = START) => Array.from({ length: n }, (_, i) => addDays(from, i));

describe('plan()', () => {
  it.each([10, 20, 30, 45, 60])('bleibt bei %i min im Zeitbudget (±1 min)', dur => {
    for (const d of days(84)) {
      const p = plan(d, opts(dur));
      expect(minutes(p, opts(dur).settings)).toBeLessThanOrEqual(dur + 1);
      expect(Math.round(p.sec / 60)).toBe(minutes(p, opts(dur).settings));
    }
  });

  it('erreicht auch an leichten Tagen die gewünschte Dauer (±2 min) und markiert Zusatzsätze', () => {
    for (const dur of [30, 45, 60]) {
      for (const d of days(28).filter(x => DAYS[weekday(x)].light)) {
        const p = plan(d, opts(dur));
        expect(minutes(p, opts(dur).settings)).toBeGreaterThanOrEqual(dur - 2);
        if (dur >= 45) expect(p.extraSets).toBe(true);
      }
    }
    expect(plan(START, opts(20)).extraSets).toBe(false);
  });

  it('enthält keine Übung doppelt', () => {
    for (const dur of [10, 30, 60]) {
      for (const d of days(56)) {
        const ids = planItems(plan(d, opts(dur))).map(it => it.id);
        expect(new Set(ids).size).toBe(ids.length);
      }
    }
  });

  it('wählt schwere Varianten nur ab Woche 2 und nie an leichten Tagen', () => {
    let advSeen = 0;
    for (const d of days(28 * 4)) {
      const p = plan(d, opts(60));
      const wk = cycle(d, START);
      for (const it of planItems(p)) {
        if (!it.v.adv) continue;
        advSeen++;
        expect(wk === 1 || wk === 2).toBe(true);
        expect(DAYS[weekday(d)].light).toBeFalsy();
      }
    }
    expect(advSeen).toBeGreaterThan(0);
  });

  it('wiederholt dieselbe Variante einer Übung nie an zwei Tagen hintereinander', () => {
    for (const seed of [0, 12345]) {
      let prev = new Map<string, number>();
      for (const d of days(120)) {
        const cur = new Map(planItems(plan(d, opts(60, { userSeed: seed }))).map(it => [it.id, it.vi]));
        for (const [id, vi] of cur) if (prev.has(id)) expect(prev.get(id)).not.toBe(vi);
        prev = cur;
      }
    }
  });

  it('liefert für gleiches Datum und gleichen Nutzer denselben Plan', () => {
    const sig = (seed: number) => JSON.stringify(planItems(plan('2026-10-10', opts(30, { userSeed: seed })))
      .map(it => [it.block, it.id, it.vi, it.sets, it.val]));
    expect(sig(42)).toBe(sig(42));
    expect(sig(42)).not.toBe(sig(43));
  });

  it('beginnt den 4-Wochen-Zyklus am individuellen Startdatum', () => {
    expect(cycle('2026-03-02', '2026-03-02')).toBe(0);
    expect(cycle('2026-03-09', '2026-03-02')).toBe(1);
    expect(cycle('2026-03-30', '2026-03-02')).toBe(0);
    expect(cycle('2026-03-01', '2026-03-02')).toBe(3);
  });
});

describe('Feedback', () => {
  it('erhöht bzw. senkt die Dosis und verhindert schwere Varianten bei „zu schwer“', () => {
    const d = '2026-01-19'; // Montag, Woche 3
    const id = 'brs'; // Fix-Übung am Montag, bei 60 min immer im Plan
    const easier = planItems(plan(d, opts(60, { feedback: { [id]: -2 } }))).find(it => it.id === id)!;
    const harder = planItems(plan(d, opts(60, { feedback: { [id]: 2 } }))).find(it => it.id === id)!;
    expect(easier.v.adv).toBeFalsy();
    const range = (easier.v.hold || easier.v.reps)!;
    expect(easier.val).toBeLessThan(range[1]);
    const hr = (harder.v.hold || harder.v.reps)!;
    expect(harder.val).toBeGreaterThan(hr[1]);
  });
});

describe('itemSec()', () => {
  it('rechnet Seiten, Sätze, Pausen und Wechsel ein', () => {
    const it0 = plan('2026-01-05', opts(20)).warm[0];
    const s = { dur: 20, rest: 30, change: 20 };
    const per = it0.unit === 's' ? it0.val : it0.val * ((it0.v.t || 3) + 1);
    expect(itemSec(it0, s)).toBe(it0.sets * per * (it0.side ? 2 : 1) + (it0.sets - 1) * 30 + 20);
  });
});
