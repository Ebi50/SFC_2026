import { useCallback, useEffect, useRef, useState } from 'react';
import type { PlanItem, TrainingSettings } from '../../lib/training/types';
import { beep } from './audio';

export type PhaseKind = 'intro' | 'work' | 'switch' | 'rest';

export interface Phase {
  label: string;
  sec: number;
  kind: PhaseKind;
  ix: number;
  reps?: number;
  tempo?: number;
  last?: boolean;
}

export function phasesFor(it: PlanItem, ix: number, first: boolean, s: TrainingSettings): Phase[] {
  const P: Phase[] = [{ label: first ? 'Bereit machen' : 'Nächste Übung', sec: first ? 10 : s.change, kind: 'intro', ix }];
  const tempo = it.v.t || 3, sides = it.side ? ['links', 'rechts'] : [''];
  const per = it.unit === 's' ? it.val : it.val * tempo;
  for (let n = 1; n <= it.sets; n++) {
    sides.forEach((sd, i) => {
      P.push({ label: `Satz ${n}/${it.sets}${sd ? ' · ' + sd : ''}`, sec: per, kind: 'work', reps: it.unit === 's' ? 0 : it.val, tempo, ix });
      if (i < sides.length - 1) P.push({ label: 'Seite wechseln', sec: 6, kind: 'switch', ix });
    });
    if (n < it.sets) P.push({ label: 'Pause', sec: s.rest, kind: 'rest', ix });
  }
  P[P.length - 1].last = true;
  return P;
}

interface Run { i: number; end: number; left: number; paused: boolean; lastSec: number | null; lastRep: number; finished: boolean }

/**
 * Ablauf-Timer: Phasen (Ansage, Sätze, Seitenwechsel, Pausen), Pause/Fortsetzen, Sprünge,
 * Töne und Wake Lock. `onExerciseDone(ix)` wird am Ende jeder Übung aufgerufen.
 */
export function useSessionTimer(items: PlanItem[], s: TrainingSettings, onExerciseDone: (ix: number) => void) {
  const [phases] = useState(() => items.flatMap((it, ix) => phasesFor(it, ix, ix === 0, s)));
  const run = useRef<Run>({ i: 0, end: Date.now() + phases[0].sec * 1000, left: 0, paused: false, lastSec: null, lastRep: 0, finished: false });
  const [, setTick] = useState(0);
  const [soundOn, setSoundOn] = useState(true);
  const sound = useRef(true);
  sound.current = soundOn;
  const doneCb = useRef(onExerciseDone);
  doneCb.current = onExerciseDone;

  const tone = (f: number, d: number, v: number) => { if (sound.current) beep(f, d, v); };

  const startPhase = useCallback((i: number) => {
    const ph = phases[i];
    Object.assign(run.current, { i, end: Date.now() + ph.sec * 1000, paused: false, lastSec: null, lastRep: 0 });
    tone(ph.kind === 'work' ? 990 : ph.kind === 'intro' ? 780 : 660, 0.25, 0.3);
  }, [phases]);

  const finish = useCallback(() => {
    run.current.finished = true;
    tone(880, 0.15, 0.3);
    setTimeout(() => tone(1175, 0.3, 0.3), 180);
  }, []);

  const nextPhase = useCallback(() => {
    const r = run.current;
    if (phases[r.i]?.last) doneCb.current(phases[r.i].ix);
    if (r.i + 1 >= phases.length) finish(); else startPhase(r.i + 1);
  }, [phases, startPhase, finish]);

  useEffect(() => { startPhase(0); }, [startPhase]);

  useEffect(() => {
    const iv = setInterval(() => {
      const r = run.current;
      if (r.finished || r.paused) { setTick(t => t + 1); return; }
      const ph = phases[r.i], left = (r.end - Date.now()) / 1000, el = ph.sec - left;
      if (ph.kind === 'work' && ph.reps) {
        const rep = Math.min(ph.reps, Math.floor(el / ph.tempo!) + 1);
        if (rep !== r.lastRep) { if (r.lastRep) tone(520, 0.06, 0.15); r.lastRep = rep; }
      }
      const sec = Math.ceil(left);
      if (sec !== r.lastSec) { if (sec <= 3 && sec > 0 && ph.kind !== 'work' && r.lastSec !== null) tone(440, 0.08, 0.2); r.lastSec = sec; }
      if (left <= 0) nextPhase();
      setTick(t => t + 1);
    }, 100);
    return () => clearInterval(iv);
  }, [phases, nextPhase]);

  // Bildschirm anlassen (nur über HTTPS; bei Ablehnung still weiter)
  useEffect(() => {
    let lock: WakeLockSentinel | null = null;
    const request = async () => { try { lock = await navigator.wakeLock?.request('screen'); } catch { lock = null; } };
    const onVis = () => { if (!document.hidden) request(); };
    request();
    document.addEventListener('visibilitychange', onVis);
    return () => { document.removeEventListener('visibilitychange', onVis); lock?.release().catch(() => undefined); };
  }, []);

  const togglePause = () => {
    const r = run.current;
    if (r.paused) { r.end = Date.now() + r.left * 1000; r.paused = false; }
    else { r.left = (r.end - Date.now()) / 1000; r.paused = true; }
    setTick(t => t + 1);
  };

  const skip = () => { if (!run.current.finished) nextPhase(); };

  const jump = (dir: 1 | -1) => {
    const r = run.current;
    if (r.finished) return;
    const cur = phases[r.i].ix;
    if (dir > 0 && cur === items.length - 1) { finish(); return; }
    const target = Math.max(0, Math.min(items.length - 1, cur + dir));
    startPhase(phases.findIndex(p => p.ix === target));
  };

  const r = run.current;
  const phase = phases[r.i];
  const left = r.finished ? 0 : Math.max(0, r.paused ? r.left : (r.end - Date.now()) / 1000);
  const total = phases.reduce((a, p) => a + p.sec, 0);
  const remaining = r.finished ? 0 : left + phases.slice(r.i + 1).reduce((a, p) => a + p.sec, 0);
  const rep = phase.kind === 'work' && phase.reps ? Math.min(phase.reps, Math.floor((phase.sec - left) / phase.tempo!) + 1) : 0;

  return {
    phase, next: phases[r.i + 1], item: items[phase.ix], ix: phase.ix,
    left, phaseFrac: r.finished ? 1 : Math.min(1, (phase.sec - left) / phase.sec),
    remaining, sessionFrac: 1 - remaining / total, rep,
    paused: r.paused, finished: r.finished, soundOn,
    togglePause, skip, jump, toggleSound: () => setSoundOn(v => !v),
  };
}
