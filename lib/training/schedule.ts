import type { DayConfig, TrainingSettings, WeekConfig } from './types';
import { NONMOB } from './exercises';

// Wochentag-Schwerpunkte (0 = Sonntag): eine feste Anker-Übung, der Rest rotiert aus dem Pool
export const DAYS: Record<number, DayConfig> = {
  1: { t: 'Kraft beidbeinig & Rumpf', short: 'Kraft', anchor: 'brs', pool: ['curl', 'brr', 'thrust', 'squat', 'nordic', 'calfraise', 'deadbug', 'superman', 'plank', 'hollow', 'pullapart', 'pushup'] },
  2: { t: 'Einbein & Stabilität', short: 'Einbein', anchor: 'bss', pool: ['hinge', 'wall', 'slb', 'revlunge', 'stepup', 'airplane', 'birddog', 'sideplank', 'copenhagen', 'clam', 'pallof', 'wallslide'] },
  3: { t: 'Mobilität & leichte Aktivierung', short: 'Mobil', anchor: 'band', pool: ['wallslide', 'r90', 'birddog', 'deadbug', 'brs', 'clam', 'ywt'], light: true },
  4: { t: 'Kraft einbeinig & Oberkörper', short: 'Kraft', anchor: 'slb', pool: ['bss', 'curl', 'hinge', 'thrust', 'revlunge', 'stepup', 'calfraise', 'monster', 'pushup', 'pullapart', 'superman', 'ywt'] },
  5: { t: 'Hüftstabilität & Anti-Rotation', short: 'Stabil', anchor: 'wall', pool: ['band', 'pallof', 'r90', 'abduct', 'clam', 'monster', 'airplane', 'sideplank', 'copenhagen', 'plank', 'birddog', 'brs'] },
  6: { t: 'Gemischt', short: 'Mix', pool: NONMOB },
  0: { t: 'Regeneration', short: 'Regen', pool: ['brs', 'band', 'birddog', 'deadbug', 'wallslide', 'r90', 'clam', 'ywt'], light: true },
};

/** Zeitanteile der Blöcke an der Gesamtdauer */
export const SPLIT = {
  normal: { warm: 0.2, main: 0.65, cool: 0.15 },
  light: { warm: 0.35, main: 0.4, cool: 0.25 },
} as const;

export const WEEKS: WeekConfig[] = [
  { n: 'Woche 1 · Einstieg', sets: 2, lvl: 0 },
  { n: 'Woche 2 · Aufbau', sets: 3, lvl: 0.5 },
  { n: 'Woche 3 · Aufbau+', sets: 3, lvl: 1 },
  { n: 'Woche 4 · Entlastung', sets: 2, lvl: 0 },
];

export const WD = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
export const WDS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

export const DEFAULT_SETTINGS: TrainingSettings = { dur: 20, rest: 45, change: 15 };
export const SETTING_LIMITS = {
  dur: { min: 10, max: 60 },
  rest: { min: 15, max: 60 },
  change: { min: 15, max: 60 },
} as const;
