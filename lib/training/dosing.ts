import type { PlanItem, TrainingSettings, Unit, WeekConfig } from './types';
import { EX } from './exercises';
import { DAYS, WEEKS } from './schedule';
import { dayNum, weekdayOfDayNum } from './dates';
import { hash, rng } from './random';

// ---------- Zyklus ----------
export function cycleIndex(dn: number, startDn: number): number {
  const w = Math.floor((dn - startDn) / 7);
  return ((w % 4) + 4) % 4;
}

/** Index der Zykluswoche (0–3) für ein Datum */
export function cycle(date: string, cycleStart: string): number {
  return cycleIndex(dayNum(date), dayNum(cycleStart));
}

// ---------- Varianten ----------
export interface Ctx { startDn: number; seed: number; feedback: Record<string, number> }

// Ab diesem Tag wird die Variantenfolge lückenlos fortgeschrieben; nur so ist garantiert,
// dass eine Übung nie an zwei Tagen hintereinander dieselbe Variante bekommt.
const ANCHOR = dayNum('2025-01-06');
const variantCache = new Map<string, number[]>();

function allowedVariants(id: string, dn: number, ctx: Ctx): number[] {
  const ex = EX[id];
  const light = !!DAYS[weekdayOfDayNum(dn)].light;
  const wk = WEEKS[cycleIndex(dn, ctx.startDn)];
  const noAdv = wk.lvl === 0 || light || (ctx.feedback[id] ?? 0) < 0;
  return ex.v.map((_, i) => i).filter(i => !(noAdv && ex.v[i].adv));
}

function pickVariant(id: string, dn: number, ctx: Ctx, exclude: number): number {
  const cands = allowedVariants(id, dn, ctx).filter(i => i !== exclude);
  const r = rng(hash(id) ^ Math.imul(dn, 2654435761) ^ ctx.seed);
  return cands[Math.floor(r() * cands.length)];
}

export function variantFor(id: string, dn: number, ctx: Ctx): number {
  if (dn < ANCHOR) return pickVariant(id, dn, ctx, -1);
  const key = `${id}|${ctx.startDn}|${ctx.seed}|${ctx.feedback[id] ?? 0}`;
  let seq = variantCache.get(key);
  if (!seq) { seq = [pickVariant(id, ANCHOR, ctx, -1)]; variantCache.set(key, seq); }
  for (let d = ANCHOR + seq.length; d <= dn; d++) seq.push(pickVariant(id, d, ctx, seq[seq.length - 1]));
  return seq[dn - ANCHOR];
}

// ---------- Übungen dosieren ----------
export function mkItem(id: string, block: PlanItem['block'], dn: number, light: boolean, wk: WeekConfig, ctx: Ctx): PlanItem {
  const ex = EX[id];
  const vi = variantFor(id, dn, ctx);
  const v = ex.v[vi];
  const range = (v.hold || v.reps)!;
  // Feedback verschiebt die Dosis innerhalb (bzw. leicht über/unter) den Bereich
  const f = Math.min(1.5, Math.max(-0.5, (light ? 0 : wk.lvl) + 0.25 * (ctx.feedback[id] ?? 0)));
  const val = Math.max(1, Math.round(range[0] + (range[1] - range[0]) * f));
  const sets = block === 'main' ? 2 : v.hold ? 2 : 1;
  const unit: Unit = v.hold ? 's' : 'Wdh.';
  return { id, block, ex, vi, v, sets, val, unit, side: !!(v.side || ex.side) };
}

/** Dauer einer Übung inkl. Satzpausen und Wechselzeit in Sekunden */
export function itemSec(it: Pick<PlanItem, 'unit' | 'val' | 'v' | 'sets' | 'side'>, s: TrainingSettings): number {
  const per = it.unit === 's' ? it.val : it.val * ((it.v.t || 3) + 1);
  return it.sets * per * (it.side ? 2 : 1) + (it.sets - 1) * s.rest + s.change;
}
