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
  /** nur Mobilität: dynamisch im Aufwärmen oder statisch im Ausklang */
  phase?: 'warm' | 'cool';
  side?: boolean;
  goal: string;
  musc: string;
  steps: string[];
  cues: string[];
  errs: string[];
  v: Variant[];
}

/** Was die Oberfläche über einen Tag anzeigt */
export interface DayLabel {
  t: string;
  short: string;
  light?: boolean;
}

export interface DayConfig extends DayLabel {
  /** feste Übung, die an diesem Wochentag immer dabei ist */
  anchor?: string;
  /** Schwerpunkt-Übungen, aus denen rotierend gewählt wird */
  pool: string[];
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
  cfg: DayLabel;
  wk: WeekConfig;
  warm: PlanItem[];
  main: PlanItem[];
  cool: PlanItem[];
  sec: number;
  /** Zusatzsätze über das übliche Maß, weil es für die gewünschte Dauer zu wenige passende Übungen gibt */
  extraSets: boolean;
}

/** Ein erledigter Eintrag – identisch im Browser-Speicher und in der Datenbank */
export interface LogEntry {
  day: string;
  block: Block;
  exerciseId: string;
  variantIndex: number;
  sets: number;
  value: number;
  unit: 'reps' | 'sec';
  completedAt?: string;
}
