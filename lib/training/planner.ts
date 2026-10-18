import type { Block, DayConfig, DayPlan, PlanItem, PlanOptions, TrainingSettings } from './types';
import { COOL, EX, NONMOB, WARM } from './exercises';
import { DAYS, SPLIT, WEEKS } from './schedule';
import { dayNum, weekdayOfDayNum } from './dates';
import { cycleIndex, itemSec, mkItem, type Ctx } from './dosing';
import { takeRotation } from './rotation';
import { fitBlock, type FitRule } from './fit';
import { legacyPlan } from './legacyPlanner';

export { cycle, itemSec } from './dosing';

/** Ab diesem Tag gelten feste Blockanteile und Rotation; frühere Tage plant weiterhin `legacyPlan`. */
export const CUTOVER = '2026-10-19';
const CUT = dayNum(CUTOVER);

/** Mindest- und Höchstzahl an Übungen je Block */
const COUNT: Record<Block, [number, number]> = { warm: [1, 6], main: [1, 12], cool: [1, 5] };
const MOB_MAX_SETS = 3;
const EXTRA_MAX_SETS = 5;

type Budgets = Record<Block, number>;
interface Slots { warm: number; focus: number; extra: number; cool: number; capped: boolean }

function budgets(cfg: DayConfig, s: TrainingSettings): Budgets {
  const sp = SPLIT[cfg.light ? 'light' : 'normal'], B = s.dur * 60;
  const warm = Math.round(B * sp.warm), main = Math.round(B * sp.main);
  return { warm, main, cool: B - warm - main };
}

const mainSets = (cfg: DayConfig, ci: number) => (cfg.light ? 2 : WEEKS[ci].sets);

// Durchschnittliche Dauer einer Übung der Gruppe bei mittlerer Dosis (ohne schwere Varianten)
const nominalCache = new Map<string, number>();
function nominal(group: string[], sets: number, s: TrainingSettings): number {
  const key = `${group.join(',')}|${sets}|${s.rest}|${s.change}`;
  let avg = nominalCache.get(key);
  if (avg === undefined) {
    const perEx = group.map(id => {
      const ex = EX[id], vs = ex.v.filter(v => !v.adv);
      return vs.reduce((a, v) => {
        const r = (v.hold || v.reps)!;
        return a + itemSec({ v, sets, val: (r[0] + r[1]) / 2, unit: v.hold ? 's' : 'Wdh.', side: !!(v.side || ex.side) }, s);
      }, 0) / vs.length;
    });
    avg = perEx.reduce((a, b) => a + b, 0) / perEx.length;
    nominalCache.set(key, avg);
  }
  return avg;
}

// Wie viele Übungen ein Block bekommt, hängt nur von Einstellungen, Wochentag und Zykluswoche ab.
// Dadurch lassen sich die Rotations-Positionen jedes Tages ohne gespeicherten Verlauf berechnen.
const slotCache = new Map<string, Slots>();
function slotsFor(wd: number, ci: number, s: TrainingSettings): Slots {
  const key = `${wd}|${ci}|${s.dur}|${s.rest}|${s.change}`;
  let sl = slotCache.get(key);
  if (!sl) {
    const cfg = DAYS[wd], b = budgets(cfg, s);
    const raw = (block: Block, group: string[], sets: number) => Math.max(COUNT[block][0], Math.round(b[block] / nominal(group, sets, s)));
    const count = (block: Block, group: string[], sets: number) => Math.min(COUNT[block][1], raw(block, group, sets));
    const mainGroup = cfg.anchor ? [cfg.anchor, ...cfg.pool] : cfg.pool;
    const k = count('main', mainGroup, mainSets(cfg, ci));
    const extra = !cfg.light && k >= 3 ? 1 : 0;
    const want = Math.max(0, k - (cfg.anchor ? 1 : 0) - extra);
    const focus = Math.min(want, cfg.pool.length);
    // zu wenige Übungen für die Dauer: dann sind Zusatzsätze erlaubt
    const capped = want > focus || raw('main', mainGroup, mainSets(cfg, ci)) > k;
    sl = { warm: count('warm', WARM, 1), cool: count('cool', COOL, 1), focus, extra, capped };
    slotCache.set(key, sl);
  }
  return sl;
}

/** Startpositionen in den Rotationen: Summe dessen, was die Tage seit der Umstellung verbraucht haben */
function pointers(dn: number, startDn: number, s: TrainingSettings) {
  const wd = weekdayOfDayNum(dn), p = { warm: 0, cool: 0, extra: 0, focus: 0 };
  for (let d = CUT; d < dn; d++) {
    const sl = slotsFor(weekdayOfDayNum(d), cycleIndex(d, startDn), s);
    p.warm += sl.warm; p.cool += sl.cool; p.extra += sl.extra;
    if (weekdayOfDayNum(d) === wd) p.focus += sl.focus;
  }
  return p;
}

// ---------- Tagesplan ----------
export function plan(date: string, opts: PlanOptions): DayPlan {
  const dn = dayNum(date);
  if (dn < CUT) return legacyPlan(date, opts);
  const s = opts.settings, seed = (opts.userSeed ?? 0) >>> 0, fb = opts.feedback ?? {};
  const ctx: Ctx = { startDn: dayNum(opts.cycleStart), seed, feedback: fb };
  const wd = weekdayOfDayNum(dn), cfg = DAYS[wd], ci = cycleIndex(dn, ctx.startDn), wk = WEEKS[ci];
  const sl = slotsFor(wd, ci, s), ptr = pointers(dn, ctx.startDn, s), b = budgets(cfg, s);

  const used = new Set<string>(cfg.anchor ? [cfg.anchor] : []);
  const take = (group: string[], key: string, start: number, k: number) => takeRotation(group, key, seed, start, k, used);
  const mainIds = [
    ...(cfg.anchor ? [cfg.anchor] : []),
    ...take(cfg.pool, `main${wd}`, ptr.focus, sl.focus),
    ...take(NONMOB, 'extra', ptr.extra, sl.extra),
  ];
  const items = (ids: string[], block: Block, sets: number): PlanItem[] =>
    ids.map(id => ({ ...mkItem(id, block, dn, !!cfg.light, wk, ctx), sets }));
  const fit = (list: PlanItem[], block: Block, rule: FitRule) => fitBlock(list, b[block], rule, s, fb);
  const warm = fit(items(take(WARM, 'warm', ptr.warm, sl.warm), 'warm', 1), 'warm', { maxSets: MOB_MAX_SETS }).items;
  // ein Satz mehr oder weniger als üblich gleicht Rundungen der Übungsanzahl aus
  const mainFit = fit(items(mainIds, 'main', mainSets(cfg, ci)), 'main', { maxSets: mainSets(cfg, ci) + 1, extraMax: sl.capped ? EXTRA_MAX_SETS : undefined });
  const main = mainFit.items, extraSets = mainFit.extra;
  const cool = fit(items(take(COOL, 'cool', ptr.cool, sl.cool), 'cool', 1), 'cool', { maxSets: MOB_MAX_SETS }).items;
  const sec = [...warm, ...main, ...cool].reduce((a, it) => a + itemSec(it, s), 0);
  return { cfg, wk, warm, main, cool, sec, extraSets };
}

export function minutes(p: DayPlan, s: TrainingSettings): number {
  return Math.max(1, Math.round(planItems(p).reduce((a, it) => a + itemSec(it, s), 0) / 60));
}

export function planItems(p: DayPlan): PlanItem[] {
  return [...p.warm, ...p.main, ...p.cool];
}

export function itemKey(it: Pick<PlanItem, 'block' | 'id'>): string {
  return `${it.block}:${it.id}`;
}
