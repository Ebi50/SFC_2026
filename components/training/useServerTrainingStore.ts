import { useCallback, useEffect, useRef, useState } from 'react';
import type { FeedbackMap, LogEntry, TrainingSettings } from '../../lib/training/types';
import { addDays, isIsoDate, todayIso } from '../../lib/training/dates';
import { entryFromItem, entryKey } from '../../lib/training/log';
import { itemKey } from '../../lib/training/planner';
import { DEFAULT_SETTINGS } from '../../lib/training/schedule';
import { LogKey, trainingApi } from '../../services/trainingApi';
import {
  LS, LogMap, TrainingStore, allEntries, lsGet, lsRemove, lsSet, sanitizeSettings, toLogMap, withEntry, withoutEntry,
} from './trainingStore';

type QueueOp = { type: 'put'; entry: LogEntry } | { type: 'del'; key: LogKey };

const opKey = (op: QueueOp) => (op.type === 'put' ? `${op.entry.day}|${entryKey(op.entry)}` : `${op.key.day}|${entryKey(op.key)}`);
const send = (op: QueueOp) => (op.type === 'put' ? trainingApi.putLog(op.entry) : trainingApi.deleteLog(op.key));

/** Sendet gepufferte Änderungen der Reihe nach; bricht beim ersten Fehler ab und behält den Rest */
async function flushQueue(userId: string): Promise<number> {
  const queue = lsGet<QueueOp[]>(LS.queue(userId), []);
  while (queue.length) {
    try { await send(queue[0]); } catch { break; }
    queue.shift();
    lsSet(LS.queue(userId), queue);
  }
  return queue.length;
}

/** Übernimmt Häkchen und Einstellungen aus dem Demo-Modus einmalig ins Konto */
async function importLocalOnce(userId: string) {
  if (lsGet(LS.imported(userId), false)) return;
  const entries = allEntries(lsGet<LogMap>(LS.log, {}));
  const rawSettings = lsGet<Partial<TrainingSettings> | null>(LS.settings, null);
  const cycleStart = lsGet<string | null>(LS.cycleStart, null);
  const settings = rawSettings && isIsoDate(cycleStart) ? { ...sanitizeSettings(rawSettings), cycleStart } : undefined;
  if (entries.length || settings) await trainingApi.importLocal({ settings, entries });
  lsSet(LS.imported(userId), true);
  lsRemove(LS.log);
}

export function useServerTrainingStore(userId: string): TrainingStore & { deleteAll: () => Promise<void> } {
  const [status, setStatus] = useState<TrainingStore['status']>('loading');
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettingsState] = useState<TrainingSettings>(DEFAULT_SETTINGS);
  const [cycleStart, setCycleStartState] = useState(todayIso());
  const [feedback, setFeedbackState] = useState<FeedbackMap>({});
  const [log, setLog] = useState<LogMap>({});
  const [pending, setPending] = useState(() => lsGet<QueueOp[]>(LS.queue(userId), []).length);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();

  const load = useCallback(async (silent = false) => {
    if (!silent) setStatus('loading');
    try {
      setPending(await flushQueue(userId));
      await importLocalOnce(userId);
      const today = todayIso();
      const [state, entries] = await Promise.all([
        trainingApi.getState(today),
        trainingApi.getLog(addDays(today, -400), addDays(today, 400)),
      ]);
      setSettingsState(state.settings);
      setCycleStartState(state.cycleStart);
      setFeedbackState(state.feedback);
      setLog(toLogMap(entries));
      setError(null);
      setStatus('ready');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Trainingsdaten konnten nicht geladen werden.');
      setStatus('error');
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const onOnline = async () => setPending(await flushQueue(userId));
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [userId]);

  const enqueue = useCallback((op: QueueOp) => {
    const queue = lsGet<QueueOp[]>(LS.queue(userId), []).filter(o => opKey(o) !== opKey(op));
    queue.push(op);
    lsSet(LS.queue(userId), queue);
    setPending(queue.length);
  }, [userId]);

  const persistSettings = useCallback((s: TrainingSettings, start: string) => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      trainingApi.saveSettings({ ...s, cycleStart: start })
        .then(() => setError(null))
        .catch(() => setError('Einstellungen konnten nicht gespeichert werden. Bitte später erneut versuchen.'));
    }, 400);
  }, []);

  const setSettings = useCallback((s: TrainingSettings) => {
    setSettingsState(s);
    persistSettings(s, cycleStart);
  }, [cycleStart, persistSettings]);

  const setCycleStart = useCallback((iso: string) => {
    setCycleStartState(iso);
    persistSettings(settings, iso);
  }, [settings, persistSettings]);

  const setDone: TrainingStore['setDone'] = useCallback((day, it, done) => {
    const entry = entryFromItem(day, it);
    const op: QueueOp = done ? { type: 'put', entry } : { type: 'del', key: { day, block: it.block, exerciseId: it.id } };
    setLog(prev => (done ? withEntry(prev, entry) : withoutEntry(prev, day, itemKey(it))));
    // Liegt schon etwas im Puffer, hinten anstellen, damit die Reihenfolge stimmt
    if (lsGet<QueueOp[]>(LS.queue(userId), []).length) { enqueue(op); return; }
    send(op).catch(() => enqueue(op));
  }, [userId, enqueue]);

  const setFeedback = useCallback((exerciseId: string, level: number) => {
    setFeedbackState(prev => ({ ...prev, [exerciseId]: level }));
    trainingApi.saveFeedback(exerciseId, level)
      .then(() => setError(null))
      .catch(() => setError('Bewertung konnte nicht gespeichert werden.'));
  }, []);

  const deleteAll = useCallback(async () => {
    await trainingApi.deleteData();
    lsRemove(LS.queue(userId));
    setPending(0);
    await load(true);
  }, [userId, load]);

  return { status, error, settings, cycleStart, feedback, log, pending, setSettings, setCycleStart, setDone, setFeedback, deleteAll };
}
