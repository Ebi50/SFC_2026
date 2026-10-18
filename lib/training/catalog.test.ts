import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { EX, figSrc } from './exercises';
import { DAYS } from './schedule';

describe('Übungskatalog', () => {
  it('hat für jede Übung beide Skizzen', () => {
    for (const id of Object.keys(EX)) {
      for (const i of [0, 1] as const) expect(existsSync(`public${figSrc(id, i)}`), `${id}-${i}`).toBe(true);
    }
  });

  it('ordnet jede Mobilitätsübung dem Aufwärmen oder dem Ausklang zu', () => {
    for (const ex of Object.values(EX)) expect(ex.type === 'mob' ? !!ex.phase : !ex.phase).toBe(true);
  });

  it('hat je Übung drei Varianten, davon mindestens eine ohne schwere Stufe', () => {
    for (const ex of Object.values(EX)) {
      expect(ex.v).toHaveLength(3);
      expect(ex.v.some(v => !v.adv)).toBe(true);
      for (const v of ex.v) expect(!!v.hold !== !!v.reps).toBe(true);
    }
  });

  it('verweist in den Wochentagen nur auf bekannte Übungen ohne Dubletten', () => {
    for (const cfg of Object.values(DAYS)) {
      const ids = [...(cfg.anchor ? [cfg.anchor] : []), ...cfg.pool];
      expect(new Set(ids).size).toBe(ids.length);
      for (const id of ids) expect(EX[id]?.type, id).not.toBe('mob');
    }
  });
});
