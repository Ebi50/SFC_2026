export type ExerciseType = 'mob' | 'str' | 'stab';
export type Block = 'warm' | 'main' | 'cool';
export type Unit = 's' | 'Wdh.';

export interface Variant {
  n: string;
  hold?: [number, number];
  reps?: [number, number];
  /** Sekunden pro Wiederholung (Standard 3) */
  t?: number;
  side?: boolean;
  /** schwere Variante: erst ab Woche 2, nie an leichten Tagen */
  adv?: boolean;
}

export interface Exercise {
  name: string;
  type: ExerciseType;
  org: 'basis' | 'add';
  side?: boolean;
  goal: string;
  musc: string;
  steps: string[];
  cues: string[];
  errs: string[];
  v: Variant[];
}

export interface DayConfig {
  t: string;
  short: string;
  fix: string[];
  pool: string[];
  light?: boolean;
  mobFirst?: boolean;
}

export interface WeekConfig {
  n: string;
  sets: number;
  lvl: number;
}

export interface TrainingSettings {
  /** Gesamtdauer in Minuten (10–60) */
  dur: number;
  /** Pause zwischen Sätzen in Sekunden (15–60) */
  rest: number;
  /** Wechsel zur nächsten Übung in Sekunden (15–60) */
  change: number;
}

/** Feedback je Übung: -2 (deutlich zu schwer) … +2 (deutlich zu leicht) */
export type FeedbackMap = Record<string, number>;

export interface PlanOptions {
  settings: TrainingSettings;
  /** ISO-Datum (YYYY-MM-DD), an dem Woche 1 des 4-Wochen-Zyklus beginnt */
  cycleStart: string;
  /** mischt z. B. die User-ID in den Zufall, damit Nutzer verschiedene Pläne bekommen */
  userSeed?: number;
  feedback?: FeedbackMap;
}

export interface PlanItem {
  id: string;
  block: Block;
  ex: Exercise;
  vi: number;
  v: Variant;
  sets: number;
  val: number;
  unit: Unit;
  side: boolean;
}

export interface DayPlan {
  cfg: DayConfig;
  wk: WeekConfig;
  warm: PlanItem[];
  main: PlanItem[];
  cool: PlanItem[];
  sec: number;
}

/** Erledigte Übungen: { "YYYY-MM-DD": { "block:id": true } } */
export type DoneMap = Record<string, Record<string, boolean>>;
