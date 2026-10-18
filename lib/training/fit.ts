import type { PlanItem, TrainingSettings } from './types';
import { itemSec } from './dosing';

export interface FitRule {
  maxSets: number;
  /** höhere Satzzahl, falls der Block mangels Übungen sonst zu kurz bliebe */
  extraMax?: number;
}

/** Wie weit Wiederholungen bzw. Haltezeit zum Feinabgleich der Dauer verschoben werden dürfen */
const VAL_TUNE = 0.3;

const total = (items: PlanItem[], s: TrainingSettings) => items.reduce((a, it) => a + itemSec(it, s), 0);

const closer = (tot: number, delta: number, budget: number) => Math.abs(tot + delta - budget) < Math.abs(tot - budget);

/** Erhöht reihum Sätze bis `max`, solange der Block damit näher ans Budget kommt. Liefert true, wenn etwas dazukam. */
function growSets(items: PlanItem[], budget: number, max: number, s: TrainingSettings): boolean {
  let tot = total(items, s), any = false;
  for (let grew = true; grew;) {
    grew = false;
    for (const it of items) {
      if (it.sets >= max) continue;
      const add = itemSec({ ...it, sets: it.sets + 1 }, s) - itemSec(it, s);
      if (closer(tot, add, budget)) { it.sets++; tot += add; grew = any = true; }
    }
  }
  return any;
}

function shrinkSets(items: PlanItem[], budget: number, s: TrainingSettings) {
  for (let tot = total(items, s); tot > budget;) {
    const it = items.filter(x => x.sets > 1).sort((a, b) => b.sets - a.sets || itemSec(b, s) - itemSec(a, s))[0];
    if (!it) return;
    const delta = itemSec({ ...it, sets: it.sets - 1 }, s) - itemSec(it, s);
    if (!closer(tot, delta, budget)) return;
    it.sets--; tot += delta;
  }
}

/** Gleicht über Wiederholungen bzw. Haltezeit ab, ohne Rückmeldungen („zu leicht/zu schwer“) umzukehren */
function tuneValues(items: PlanItem[], budget: number, s: TrainingSettings, feedback: Record<string, number>) {
  const base = items.map(it => it.val);
  const lo = items.map((it, i) => (feedback[it.id] ?? 0) > 0 ? base[i] : Math.max(1, Math.round(base[i] * (1 - VAL_TUNE))));
  const hi = items.map((it, i) => (feedback[it.id] ?? 0) < 0 ? base[i] : Math.round(base[i] * (1 + VAL_TUNE)));
  let diff = budget - total(items, s);
  for (;;) {
    let best = -1, dir = 0, bestErr = Infinity, bestDev = Infinity;
    items.forEach((it, i) => {
      for (const d of [1, -1]) {
        const val = it.val + d;
        if (val < lo[i] || val > hi[i]) continue;
        const err = Math.abs(diff - (itemSec({ ...it, val }, s) - itemSec(it, s)));
        const dev = Math.abs(val - base[i]) / base[i];
        // nur Schritte, die näher ans Budget führen; davon die Übung, die am wenigsten abweicht
        if (err >= Math.abs(diff)) continue;
        if (dev < bestDev || (dev === bestDev && err < bestErr)) { best = i; dir = d; bestErr = err; bestDev = dev; }
      }
    });
    if (best < 0) return;
    const it = items[best];
    diff -= itemSec({ ...it, val: it.val + dir }, s) - itemSec(it, s);
    it.val += dir;
  }
}

function fitOnce(items: PlanItem[], budget: number, rule: FitRule, s: TrainingSettings, feedback: Record<string, number>): boolean {
  shrinkSets(items, budget, s);
  growSets(items, budget, rule.maxSets, s);
  const extra = !!rule.extraMax && growSets(items, budget, rule.extraMax, s);
  tuneValues(items, budget, s, feedback);
  return extra;
}

/**
 * Passt Sätze und Dosis eines Blocks an sein Zeitbudget an. Bleibt er selbst mit kleinster Dosis
 * deutlich zu lang, entfällt die letzte Übung. Liefert die verbleibenden Übungen und ob Zusatzsätze nötig waren.
 */
export function fitBlock(items: PlanItem[], budget: number, rule: FitRule, s: TrainingSettings, feedback: Record<string, number>): { items: PlanItem[]; extra: boolean } {
  const start = items.map(it => ({ ...it }));
  let extra = fitOnce(items, budget, rule, s, feedback);
  while (items.length > 1) {
    const fewer = start.slice(0, items.length - 1).map(it => ({ ...it }));
    const extraFewer = fitOnce(fewer, budget, rule, s, feedback);
    if (Math.abs(total(fewer, s) - budget) >= Math.abs(total(items, s) - budget)) break;
    items = fewer; extra = extraFewer;
  }
  return { items, extra };
}
