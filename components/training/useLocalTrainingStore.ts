import { useCallback, useState } from 'react';
import type { LogEntry, TrainingSettings } from '../../lib/training/types';
import { isIsoDate, mondayOf, todayIso } from '../../lib/training/dates';
import { entryFromItem } from '../../lib/training/log';
import { itemKey } from '../../lib/training/planner';
import { LS, LogMap, TrainingStore, lsGet, lsSet, sanitizeSettings, withEntry, withoutEntry } from './trainingStore';

/** Demo-Modus: alles bleibt nur in diesem Browser */
export function useLocalTrainingStore(): TrainingStore {
  const [settings, setSettingsState] = useState(() => sanitizeSettings(lsGet<Partial<TrainingSettings> | null>(LS.settings, null)));
  const [cycleStart, setCycleStartState] = useState(() => {
    const stored = lsGet<string | null>(LS.cycleStart, null);
    if (isIsoDate(stored)) return stored;
    const start = mondayOf(todayIso());
    lsSet(LS.cycleStart, start);
    return start;
  });
  const [log, setLog] = useState<LogMap>(() => lsGet<LogMap>(LS.log, {}));

  const setSettings = useCallback((s: TrainingSettings) => {
    setSettingsState(s);
    lsSet(LS.settings, s);
  }, []);

  const setCycleStart = useCallback((iso: string) => {
    setCycleStartState(iso);
    lsSet(LS.cycleStart, iso);
  }, []);

  const setDone: TrainingStore['setDone'] = useCallback((day, it, done) => {
    setLog(prev => {
      const entry: LogEntry = { ...entryFromItem(day, it), completedAt: new Date().toISOString() };
      const next = done ? withEntry(prev, entry) : withoutEntry(prev, day, itemKey(it));
      lsSet(LS.log, next);
      return next;
    });
  }, []);

  return { status: 'ready', error: null, settings, cycleStart, feedback: {}, log, pending: 0, setSettings, setCycleStart, setDone };
}
