import { describe, expect, it } from 'vitest';
import { CUTOVER, cycle, itemSec, minutes, plan, planItems } from './planner';
import { legacyPlan } from './legacyPlanner';
import { addDays, weekday } from './dates';
import { DAYS, SPLIT } from './schedule';
import { COOL, EX, NONMOB, WARM } from './exercises';
import type { PlanOptions } from './types';

const START = CUTOVER; // Montag, Beginn von Woche 1
const opts = (dur = 20, extra: Partial<PlanOptions> = {}): PlanOptions => ({
  settings: { dur, rest: 45, change: 15 }, cycleStart: START, ...extra,
});
const days = (n: number, from = START) => Array.from({ length: n }, (_, i) => addDays(from, i));

describe('plan()', () => {
  it.each([20, 30, 45, 60])('teilt %i min fest auf Aufwärmen, Hauptteil und Ausklang auf', dur => {
    for (const rest of [15, 45, 60]) {
      const o = opts(dur, { settings: { dur, rest, change: 15 } });
      for (const d of days(84)) {
        const p = plan(d, o);
        const sp = SPLIT[p.cfg.light ? 'light' : 'normal'];
        for (const block of ['warm', 'main', 'cool'] as const) {
          const sec = p[block].reduce((a, it) => a + itemSec(it, o.settings), 0);
          expect(Math.abs(sec - dur * 60 * sp[block])).toBeLessThanOrEqual(dur >= 30 ? 30 : 60);
        }
        expect(Math.abs(minutes(p, o.settings) - dur)).toBeLessThanOrEqual(1);
        expect(Math.round(p.sec / 60)).toBe(minutes(p, o.settings));
      }
    }
  });

  it('bleibt auch bei 10 min nah an der Wunschdauer (±2 min)', () => {
    for (const d of days(56)) expect(Math.abs(minutes(plan(d, opts(10)), opts(10).settings) - 10)).toBeLessThanOrEqual(2);
  });

  it('wärmt dynamisch auf und dehnt im Ausklang statisch', () => {
    for (const d of days(28)) {
      const p = plan(d, opts(30));
      expect(p.warm.every(it => it.ex.phase === 'warm')).toBe(true);
      expect(p.cool.every(it => it.ex.phase === 'cool')).toBe(true);
      expect(p.main.every(it => it.ex.type !== 'mob')).toBe(true);
    }
  });

  it('beginnt den Hauptteil mit der Anker-Übung des Wochentags', () => {
    for (const d of days(28)) {
      const anchor = DAYS[weekday(d)].anchor;
      if (anchor) expect(plan(d, opts(20)).main[0].id).toBe(anchor);
    }
  });

  it('rotiert gleichmäßig durch alle Übungen', () => {
    for (const seed of [0, 12345]) {
      const count: Record<string, number> = {};
      for (const d of days(42)) for (const it of planItems(plan(d, opts(20, { userSeed: seed })))) count[it.id] = (count[it.id] ?? 0) + 1;
      // in 6 Wochen kommt jede Übung vor
      expect(Object.keys(count).sort()).toEqual(Object.keys(EX).sort());
      // Aufwärmen und Ausklang: keine Übung mehr als doppelt so oft wie eine andere der Gruppe
      for (const group of [WARM, COOL]) {
        const c = group.map(id => count[id]);
        expect(Math.max(...c)).toBeLessThanOrEqual(2 * Math.min(...c));
      }
    }
  });

  it('wiederholt im Aufwärmen und Ausklang keine Übung vom Vortag', () => {
    let prev = new Set<string>();
    for (const d of days(84)) {
      const p = plan(d, opts(20));
      const cur = new Set([...p.warm, ...p.cool].map(it => it.id));
      for (const id of cur) expect(prev.has(id)).toBe(false);
      prev = cur;
    }
  });

  it('markiert Zusatzsätze nur, wenn die Übungen für die Dauer nicht reichen', () => {
    for (const d of days(28)) expect(plan(d, opts(20)).extraSets).toBe(false);
  });

  it('lässt Tage vor der Umstellung unverändert', () => {
    for (const d of days(14, addDays(CUTOVER, -14))) {
      expect(JSON.stringify(plan(d, opts(30)))).toBe(JSON.stringify(legacyPlan(d, opts(30))));
    }
    expect(NONMOB.length).toBeGreaterThan(20);
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
    const d = addDays(START, 14); // Montag, Woche 3
    const id = 'brs'; // Anker-Übung am Montag, immer im Plan
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
    const it0 = plan(START, opts(20)).warm[0];
    const s = { dur: 20, rest: 30, change: 20 };
    const per = it0.unit === 's' ? it0.val : it0.val * ((it0.v.t || 3) + 1);
    expect(itemSec(it0, s)).toBe(it0.sets * per * (it0.side ? 2 : 1) + (it0.sets - 1) * 30 + 20);
  });
});
