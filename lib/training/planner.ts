import type { DayConfig, DayPlan, PlanItem, PlanOptions, TrainingSettings, Unit, WeekConfig } from './types';
import { EX, MOB, NONMOB } from './exercises';
import { DAYS, WEEKS } from './schedule';
import { dayNum, weekdayOfDayNum } from './dates';

// ---------- deterministischer Zufall ----------
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hash(s: string): number {
  let h = 2166136261;
  for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

function shuffle<T>(arr: T[], r: () => number): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------- Zyklus ----------
function cycleIndex(dn: number, startDn: number): number {
  const w = Math.floor((dn - startDn) / 7);
  return ((w % 4) + 4) % 4;
}

/** Index der Zykluswoche (0–3) für ein Datum */
export function cycle(date: string, cycleStart: string): number {
  return cycleIndex(dayNum(date), dayNum(cycleStart));
}

// ---------- Varianten ----------
interface Ctx { startDn: number; seed: number; feedback: Record<string, number> }

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
function mkItem(id: string, block: PlanItem['block'], dn: number, cfg: DayConfig, wk: WeekConfig, ctx: Ctx): PlanItem {
  const ex = EX[id];
  const vi = variantFor(id, dn, ctx);
  const v = ex.v[vi];
  const range = (v.hold || v.reps)!;
  // Feedback verschiebt die Dosis innerhalb (bzw. leicht über/unter) den Bereich
  const f = Math.min(1.5, Math.max(-0.5, (cfg.light ? 0 : wk.lvl) + 0.25 * (ctx.feedback[id] ?? 0)));
  const val = Math.max(1, Math.round(range[0] + (range[1] - range[0]) * f));
  const sets = block === 'main' ? 2 : v.hold ? 2 : 1;
  const unit: Unit = v.hold ? 's' : 'Wdh.';
  return { id, block, ex, vi, v, sets, val, unit, side: !!(v.side || ex.side) };
}

/** Dauer einer Übung inkl. Satzpausen und Wechselzeit in Sekunden */
export function itemSec(it: PlanItem, s: TrainingSettings): number {
  const per = it.unit === 's' ? it.val : it.val * ((it.v.t || 3) + 1);
  return it.sets * per * (it.side ? 2 : 1) + (it.sets - 1) * s.rest + s.change;
}

export function minutes(p: DayPlan, s: TrainingSettings): number {
  return Math.max(1, Math.round([...p.warm, ...p.main, ...p.cool].reduce((a, it) => a + itemSec(it, s), 0) / 60));
}

// ---------- Tagesplan ----------
const EXTRA_MAX_SETS = 5;

export function plan(date: string, opts: PlanOptions): DayPlan {
  const s = opts.settings;
  const dn = dayNum(date), seed = (opts.userSeed ?? 0) >>> 0;
  const ctx: Ctx = { startDn: dayNum(opts.cycleStart), seed, feedback: opts.feedback ?? {} };
  const r = rng((dn * 7919 + 13) ^ seed), cfg = DAYS[weekdayOfDayNum(dn)], wk = WEEKS[cycleIndex(dn, ctx.startDn)];
  const B = s.dur * 60;

  const mobs = shuffle(MOB, r);
  const mainIds = [...shuffle(cfg.fix, r), ...shuffle(cfg.pool.filter(x => !cfg.fix.includes(x)), r)];
  if (!cfg.light) mainIds.push(...shuffle(NONMOB.filter(x => !mainIds.includes(x)), r));

  // Kandidaten-Reihenfolge = Priorität: abwechselnd Haupt- und Mobilitätsübungen
  const W = mobs.slice(0, -1).map(id => mkItem(id, 'warm', dn, cfg, wk, ctx));
  const C = mkItem(mobs[mobs.length - 1], 'cool', dn, cfg, wk, ctx);
  const M = mainIds.map(id => {
    const it = mkItem(id, 'main', dn, cfg, wk, ctx);
    if (cfg.fix.includes(id) && !cfg.light) it.sets = wk.sets;
    return it;
  });
  const seq: PlanItem[] = [];
  let wi = 0, mi = 0;
  const pattern = cfg.mobFirst ? 'wwmcwmwm' : 'wmmcmwmmw';
  for (const c of pattern) {
    if (c === 'w' && wi < W.length) seq.push(W[wi++]);
    else if (c === 'm' && mi < M.length) seq.push(M[mi++]);
    else if (c === 'c') seq.push(C);
  }
  while (wi < W.length || mi < M.length) {
    if (mi < M.length) seq.push(M[mi++]);
    if (mi < M.length) seq.push(M[mi++]);
    if (wi < W.length) seq.push(W[wi++]);
  }

  // Auffüllen bis zum Zeitbudget
  const chosen: PlanItem[] = [];
  let tot = 0;
  for (const it of seq) {
    const t = itemSec(it, s);
    if (tot + t <= B || chosen.length < 2) { chosen.push(it); tot += t; }
  }
  const mains = () => chosen.filter(x => x.block === 'main');
  // zu lang (sehr kurzes Budget): Sätze reduzieren
  for (let guard = 0; tot > B && guard < 20; guard++) {
    const m = mains().filter(x => x.sets > 1).sort((a, b) => b.sets - a.sets)[0];
    if (!m) break;
    tot -= itemSec(m, s); m.sets--; tot += itemSec(m, s);
  }
  // Zeit übrig: Sätze der Hauptübungen erhöhen
  const maxSets = cfg.light ? 2 : wk.sets;
  let grew = true;
  while (grew) {
    grew = false;
    for (const m of mains()) {
      if (m.sets >= maxSets) continue;
      const before = itemSec(m, s);
      m.sets++;
      const add = itemSec(m, s) - before;
      if (tot + add <= B) { tot += add; grew = true; } else m.sets--;
    }
  }
  // Alle Übungen des Tages verplant und noch Zeit übrig (v. a. leichte Tage mit kleinem Pool):
  // weitere Sätze bis zur gewünschten Dauer, Mobilität zuerst, damit der Tag locker bleibt.
  let extraSets = false;
  if (chosen.length === seq.length) {
    const order = [...chosen.filter(x => x.block !== 'main'), ...mains()];
    for (grew = true; grew;) {
      grew = false;
      for (const it of order) {
        if (it.sets >= EXTRA_MAX_SETS) continue;
        const before = itemSec(it, s);
        it.sets++;
        const add = itemSec(it, s) - before;
        if (tot + add <= B) { tot += add; grew = extraSets = true; } else it.sets--;
      }
    }
  }
  return {
    cfg, wk, extraSets,
    warm: chosen.filter(x => x.block === 'warm'),
    main: shuffle(mains(), rng((dn * 31 + 7) ^ seed)),
    cool: chosen.filter(x => x.block === 'cool'),
    sec: tot,
  };
}

export function planItems(p: DayPlan): PlanItem[] {
  return [...p.warm, ...p.main, ...p.cool];
}

export function itemKey(it: Pick<PlanItem, 'block' | 'id'>): string {
  return `${it.block}:${it.id}`;
}
