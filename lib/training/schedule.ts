import type { DayConfig, TrainingSettings, WeekConfig } from './types';
import { NONMOB } from './exercises';

// Wochentag-Schwerpunkte (0 = Sonntag)
export const DAYS: Record<number, DayConfig> = {
  1: { t: 'Kraft beidbeinig & Rumpf', short: 'Kraft', fix: ['brs', 'curl', 'brr'], pool: ['thrust', 'deadbug', 'superman', 'pullapart', 'pushup'] },
  2: { t: 'Einbein & Stabilität', short: 'Einbein', fix: ['bss', 'hinge', 'wall'], pool: ['slb', 'birddog', 'sideplank', 'pallof', 'wallslide'] },
  3: { t: 'Mobilität & leichte Aktivierung', short: 'Mobil', fix: ['band', 'wallslide'], pool: ['r90', 'birddog', 'deadbug', 'brs'], light: true, mobFirst: true },
  4: { t: 'Kraft einbeinig & Oberkörper', short: 'Kraft', fix: ['bss', 'slb'], pool: ['curl', 'hinge', 'thrust', 'monster', 'pushup', 'pullapart', 'superman'] },
  5: { t: 'Hüftstabilität & Anti-Rotation', short: 'Stabil', fix: ['wall', 'band', 'pallof'], pool: ['r90', 'abduct', 'monster', 'sideplank', 'birddog', 'brs'] },
  6: { t: 'Gemischt', short: 'Mix', fix: [], pool: NONMOB },
  0: { t: 'Regeneration', short: 'Regen', fix: [], pool: ['brs', 'band', 'birddog', 'deadbug', 'wallslide'], light: true, mobFirst: true },
};

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
