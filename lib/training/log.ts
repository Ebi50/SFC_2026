import type { LogEntry, PlanItem, TrainingSettings } from './types';
import { EX } from './exercises';
import { addDays, dayNum, mondayOf } from './dates';

export function entryFromItem(day: string, it: PlanItem): LogEntry {
  return {
    day, block: it.block, exerciseId: it.id, variantIndex: it.vi,
    sets: it.sets, value: it.val, unit: it.unit === 's' ? 'sec' : 'reps',
  };
}

export function entryKey(e: Pick<LogEntry, 'block' | 'exerciseId'>): string {
  return `${e.block}:${e.exerciseId}`;
}

/** Dauer eines erledigten Eintrags in Sekunden (wie itemSec, aber aus den gespeicherten Werten) */
export function entrySeconds(e: LogEntry, s: TrainingSettings): number {
  const ex = EX[e.exerciseId];
  const v = ex?.v[e.variantIndex];
  if (!v) return 0;
  const per = e.unit === 'sec' ? e.value : e.value * ((v.t || 3) + 1);
  return e.sets * per * (v.side || ex.side ? 2 : 1) + (e.sets - 1) * s.rest + s.change;
}

export interface HistoryStats {
  days: { day: string; count: number; minutes: number }[];
  streak: number;
  weeks: { monday: string; minutes: number; days: number }[];
  exercises: { id: string; name: string; count: number }[];
}

/**
 * Verlauf: absolvierte Tage (neueste zuerst), Serie in Tagen bis heute,
 * Minuten der letzten `weekCount` Wochen und Häufigkeit je Übung.
 */
export function historyStats(entries: LogEntry[], today: string, s: TrainingSettings, weekCount = 8): HistoryStats {
  const byDay = new Map<string, LogEntry[]>();
  const byEx = new Map<string, number>();
  for (const e of entries) {
    if (dayNum(e.day) > dayNum(today)) continue;
    byDay.set(e.day, [...(byDay.get(e.day) ?? []), e]);
    byEx.set(e.exerciseId, (byEx.get(e.exerciseId) ?? 0) + 1);
  }
  const days = [...byDay.entries()]
    .map(([day, es]) => ({ day, count: es.length, minutes: Math.round(es.reduce((a, e) => a + entrySeconds(e, s), 0) / 60) }))
    .sort((a, b) => (a.day < b.day ? 1 : -1));

  // Serie zählt ab heute; ist heute noch nichts erledigt, ab gestern
  let streak = 0;
  let d = byDay.has(today) ? today : addDays(today, -1);
  while (byDay.has(d)) { streak++; d = addDays(d, -1); }

  const thisMonday = mondayOf(today);
  const weeks = Array.from({ length: weekCount }, (_, i) => {
    const monday = addDays(thisMonday, -7 * i);
    const inWeek = days.filter(x => dayNum(x.day) >= dayNum(monday) && dayNum(x.day) < dayNum(monday) + 7);
    return { monday, minutes: inWeek.reduce((a, x) => a + x.minutes, 0), days: inWeek.length };
  });

  const exercises = [...byEx.entries()]
    .filter(([id]) => EX[id])
    .map(([id, count]) => ({ id, name: EX[id].name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'de'));

  return { days, streak, weeks, exercises };
}
