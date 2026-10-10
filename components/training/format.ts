import type { PlanItem, Variant } from '../../lib/training/types';

export function doseText(it: PlanItem): string {
  return `${it.sets} × ${it.val} ${it.unit}${it.side ? ' pro Seite' : ''}`;
}

export function rangeText(v: Variant, exSide?: boolean): string {
  const [a, b] = (v.hold || v.reps)!;
  return `${a}–${b} ${v.hold ? 's' : 'Wdh.'}${v.side || exSide ? ' pro Seite' : ''}`;
}

export function fmtSec(v: number): string {
  return v >= 60 ? '1 min' : `${v} s`;
}

export const FEEDBACK_LABEL: Record<number, string> = {
  [-2]: 'deutlich leichter', [-1]: 'etwas leichter', 0: 'Standard', 1: 'etwas schwerer', 2: 'deutlich schwerer',
};
