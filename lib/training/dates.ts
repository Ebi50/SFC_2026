// Alle Tage werden als ISO-Datum "YYYY-MM-DD" gehandhabt und in UTC gerechnet,
// damit Zeitzonen und Sommerzeit keine Tage verschieben.

export function dayNum(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / 864e5);
}

export function isoFromDayNum(dn: number): string {
  return new Date(dn * 864e5).toISOString().slice(0, 10);
}

export function addDays(iso: string, n: number): string {
  return isoFromDayNum(dayNum(iso) + n);
}

/** 0 = Sonntag … 6 = Samstag */
export function weekdayOfDayNum(dn: number): number {
  return (((dn + 4) % 7) + 7) % 7; // 01.01.1970 war ein Donnerstag
}

export function weekday(iso: string): number {
  return weekdayOfDayNum(dayNum(iso));
}

/** Montag der Woche, in der `iso` liegt */
export function mondayOf(iso: string): string {
  return addDays(iso, -((weekday(iso) + 6) % 7));
}

export function todayIso(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function isIsoDate(s: unknown): s is string {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && isoFromDayNum(dayNum(s)) === s;
}

export function formatLong(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}
