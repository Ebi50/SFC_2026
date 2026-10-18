import { hash, rng, shuffle } from './random';

// Jede Übungsgruppe läuft als endlose Folge von Runden: In jeder Runde kommt jede Übung genau
// einmal vor, jede Runde ist neu gemischt (pro Nutzer verschieden). Eine Übung kommt erst wieder,
// wenn mindestens alle anderen bis auf SPREAD dran waren – auch über den Rundenwechsel hinweg.
const SPREAD = 3;

const rounds = new Map<string, string[][]>();

function nextRound(group: string[], key: string, seed: number, r: number, prev?: string[]): string[] {
  const left = shuffle(group, rng(hash(key) ^ seed ^ Math.imul(r + 1, 0x9E3779B1)));
  if (!prev) return left;
  const n = group.length, gap = Math.max(1, n - SPREAD), last = new Map(prev.map((id, i) => [id, i]));
  const out: string[] = [];
  // Platz j bekommt die erste gemischte Übung mit genügend Abstand zu ihrem Platz in der Vorrunde
  for (let j = 0; j < n; j++) out.push(...left.splice(left.findIndex(id => n - last.get(id)! + j >= gap), 1));
  return out;
}

function roundOf(group: string[], key: string, seed: number, r: number): string[] {
  const k = `${key}|${seed}|${group.join(',')}`;
  let list = rounds.get(k);
  if (!list) { list = []; rounds.set(k, list); }
  while (list.length <= r) list.push(nextRound(group, key, seed, list.length, list[list.length - 1]));
  return list[r];
}

/** Übung an Position `pos` der Folge */
export function rotationAt(group: string[], key: string, seed: number, pos: number): string {
  const n = group.length;
  return roundOf(group, key, seed, Math.floor(pos / n))[pos % n];
}

/** Bis zu `k` Übungen ab Position `start`; bereits vergebene (`used`) werden übersprungen */
export function takeRotation(group: string[], key: string, seed: number, start: number, k: number, used: Set<string>): string[] {
  const out: string[] = [];
  for (let pos = start; out.length < k && pos < start + 2 * group.length; pos++) {
    const id = rotationAt(group, key, seed, pos);
    if (!used.has(id)) { out.push(id); used.add(id); }
  }
  return out;
}
