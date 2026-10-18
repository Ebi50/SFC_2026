import type { DayLabel, DayPlan, PlanItem, PlanOptions } from './types';
import { WEEKS } from './schedule';
import { dayNum, weekdayOfDayNum } from './dates';
import { rng, shuffle } from './random';
import { cycleIndex, itemSec, mkItem, type Ctx } from './dosing';

// Planer bis zur Umstellung auf feste Blockanteile und Rotation. Er bleibt unverändert,
// damit bereits trainierte Tage (Häkchen, Wochenleiste) genauso aussehen wie damals.
// Übungslisten und Wochentage sind deshalb hier eingefroren.

interface LegacyDay extends DayLabel { fix: string[]; pool: string[]; mobFirst?: boolean }

const MOB = ['ham', 'fig4', 'wgs', 'catcow', 'hipflex', 'openbook', 'tspine', 'couch'];
const NONMOB = ['brs', 'curl', 'slb', 'bss', 'hinge', 'wall', 'r90', 'band', 'brr', 'birddog', 'deadbug', 'sideplank',
  'superman', 'abduct', 'monster', 'thrust', 'pullapart', 'wallslide', 'pallof', 'pushup'];
const DAYS: Record<number, LegacyDay> = {
  1: { t: 'Kraft beidbeinig & Rumpf', short: 'Kraft', fix: ['brs', 'curl', 'brr'], pool: ['thrust', 'deadbug', 'superman', 'pullapart', 'pushup'] },
  2: { t: 'Einbein & Stabilität', short: 'Einbein', fix: ['bss', 'hinge', 'wall'], pool: ['slb', 'birddog', 'sideplank', 'pallof', 'wallslide'] },
  3: { t: 'Mobilität & leichte Aktivierung', short: 'Mobil', fix: ['band', 'wallslide'], pool: ['r90', 'birddog', 'deadbug', 'brs'], light: true, mobFirst: true },
  4: { t: 'Kraft einbeinig & Oberkörper', short: 'Kraft', fix: ['bss', 'slb'], pool: ['curl', 'hinge', 'thrust', 'monster', 'pushup', 'pullapart', 'superman'] },
  5: { t: 'Hüftstabilität & Anti-Rotation', short: 'Stabil', fix: ['wall', 'band', 'pallof'], pool: ['r90', 'abduct', 'monster', 'sideplank', 'birddog', 'brs'] },
  6: { t: 'Gemischt', short: 'Mix', fix: [], pool: NONMOB },
  0: { t: 'Regeneration', short: 'Regen', fix: [], pool: ['brs', 'band', 'birddog', 'deadbug', 'wallslide'], light: true, mobFirst: true },
};
const EXTRA_MAX_SETS = 5;

export function legacyPlan(date: string, opts: PlanOptions): DayPlan {
  const s = opts.settings;
  const dn = dayNum(date), seed = (opts.userSeed ?? 0) >>> 0;
  const ctx: Ctx = { startDn: dayNum(opts.cycleStart), seed, feedback: opts.feedback ?? {} };
  const r = rng((dn * 7919 + 13) ^ seed), cfg = DAYS[weekdayOfDayNum(dn)], wk = WEEKS[cycleIndex(dn, ctx.startDn)];
  const light = !!cfg.light;
  const B = s.dur * 60;

  const mobs = shuffle(MOB, r);
  const mainIds = [...shuffle(cfg.fix, r), ...shuffle(cfg.pool.filter(x => !cfg.fix.includes(x)), r)];
  if (!light) mainIds.push(...shuffle(NONMOB.filter(x => !mainIds.includes(x)), r));

  // Kandidaten-Reihenfolge = Priorität: abwechselnd Haupt- und Mobilitätsübungen
  const W = mobs.slice(0, -1).map(id => mkItem(id, 'warm', dn, light, wk, ctx));
  const C = mkItem(mobs[mobs.length - 1], 'cool', dn, light, wk, ctx);
  const M = mainIds.map(id => {
    const it = mkItem(id, 'main', dn, light, wk, ctx);
    if (cfg.fix.includes(id) && !light) it.sets = wk.sets;
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
  const maxSets = light ? 2 : wk.sets;
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
  // Alle Übungen des Tages verplant und noch Zeit übrig: weitere Sätze, Mobilität zuerst
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
