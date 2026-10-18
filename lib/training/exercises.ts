import type { Exercise } from './types';
import { MOBILITY } from './catalog/mobility';
import { STRENGTH } from './catalog/strength';
import { STABILITY } from './catalog/stability';

// type: 'mob' Mobilität/Dehnung, 'str' Kraft, 'stab' Stabilität/Rumpf
// org: 'basis' (Basisprogramm) oder 'add' (Ergänzung Radsport)
export const EX: Record<string, Exercise> = { ...MOBILITY, ...STRENGTH, ...STABILITY };

const ids = (f: (ex: Exercise) => boolean) => Object.keys(EX).filter(k => f(EX[k]));
/** dynamische Mobilität fürs Aufwärmen */
export const WARM = ids(ex => ex.phase === 'warm');
/** statisches Dehnen für den Ausklang */
export const COOL = ids(ex => ex.phase === 'cool');
export const NONMOB = ids(ex => ex.type !== 'mob');

/** Übungen, deren Skizze von oben gezeichnet ist */
export const TOPVIEW = ['r90', 'band', 'openbook', 'pallof', 'ywt'];

export const TYPE_LABEL: Record<Exercise['type'], string> = { mob: 'Mobilität', str: 'Kraft', stab: 'Stabilität' };
export const ORG_LABEL: Record<Exercise['org'], string> = { basis: 'Basisprogramm', add: 'Ergänzung Radsport' };

export function figSrc(id: string, i: 0 | 1): string {
  return `/training-figs/${id}-${i}.svg`;
}
