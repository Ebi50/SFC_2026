import type { FeedbackMap, LogEntry, PlanItem, TrainingSettings } from '../../lib/training/types';
import { entryKey } from '../../lib/training/log';
import { itemKey } from '../../lib/training/planner';
import { DEFAULT_SETTINGS, SETTING_LIMITS } from '../../lib/training/schedule';

/** day -> "block:id" -> Eintrag */
export type LogMap = Record<string, Record<string, LogEntry>>;

export interface TrainingStore {
  status: 'loading' | 'ready' | 'error';
  error: string | null;
  settings: TrainingSettings;
  cycleStart: string;
  feedback: FeedbackMap;
  log: LogMap;
  /** Anzahl noch nicht synchronisierter Änderungen */
  pending: number;
  setSettings: (s: TrainingSettings) => void;
  setCycleStart: (iso: string) => void;
  setDone: (day: string, it: PlanItem, done: boolean) => void;
  /** nur für eingeloggte Nutzer (Phase 2) */
  setFeedback?: (exerciseId: string, level: number) => void;
}

export const LS = {
  settings: 'sfc-training-settings',
  cycleStart: 'sfc-training-cycle-start',
  log: 'sfc-training-log',
  imported: (userId: string) => `sfc-training-imported:${userId}`,
  queue: (userId: string) => `sfc-training-queue:${userId}`,
};

export function lsGet<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v === null ? fallback : (JSON.parse(v) as T);
  } catch {
    return fallback;
  }
}

export function lsSet(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Speicher nicht verfügbar – still weiter */ }
}

export function lsRemove(key: string) {
  try { localStorage.removeItem(key); } catch { /* s. o. */ }
}

/** Liest Einstellungen tolerant und hält sie in den erlaubten Grenzen */
export function sanitizeSettings(raw: Partial<TrainingSettings> | null | undefined): TrainingSettings {
  const out = { ...DEFAULT_SETTINGS };
  for (const k of ['dur', 'rest', 'change'] as const) {
    const v = Number(raw?.[k]);
    if (Number.isFinite(v)) out[k] = Math.min(SETTING_LIMITS[k].max, Math.max(SETTING_LIMITS[k].min, Math.round(v / 5) * 5));
  }
  return out;
}

export function withEntry(log: LogMap, e: LogEntry): LogMap {
  return { ...log, [e.day]: { ...log[e.day], [entryKey(e)]: e } };
}

export function withoutEntry(log: LogMap, day: string, key: string): LogMap {
  const { [key]: _removed, ...rest } = log[day] ?? {};
  return { ...log, [day]: rest };
}

export function toLogMap(entries: LogEntry[]): LogMap {
  return entries.reduce<LogMap>((m, e) => withEntry(m, e), {});
}

export function allEntries(log: LogMap): LogEntry[] {
  return Object.values(log).flatMap(d => Object.values(d));
}

export function isDone(log: LogMap, day: string, it: PlanItem): boolean {
  return !!log[day]?.[itemKey(it)];
}
