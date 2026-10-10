import { apiRequest } from './api';
import type { FeedbackMap, LogEntry, TrainingSettings } from '../lib/training/types';

export interface TrainingStateDto {
  settings: TrainingSettings;
  cycleStart: string;
  feedback: FeedbackMap;
}

export type LogKey = Pick<LogEntry, 'day' | 'block' | 'exerciseId'>;

const data = <T,>(p: Promise<{ data: T }>) => p.then(r => r.data);
const json = (method: string, body: unknown): RequestInit => ({ method, body: JSON.stringify(body) });

export const trainingApi = {
  getState: (today: string) => data<TrainingStateDto>(apiRequest(`/training/state?today=${today}`)),
  saveSettings: (s: TrainingSettings & { cycleStart: string }) => apiRequest('/training/settings', json('PUT', s)),
  getLog: (from: string, to: string) => data<LogEntry[]>(apiRequest(`/training/log?from=${from}&to=${to}`)),
  putLog: (e: LogEntry) => apiRequest('/training/log', json('PUT', e)),
  deleteLog: (k: LogKey) => apiRequest('/training/log', json('DELETE', k)),
  saveFeedback: (exerciseId: string, level: number) => apiRequest('/training/feedback', json('PUT', { exerciseId, level })),
  importLocal: (payload: { settings?: TrainingSettings & { cycleStart: string }; entries: LogEntry[] }) =>
    apiRequest('/training/import', json('POST', payload)),
  deleteData: () => apiRequest('/training/data', { method: 'DELETE' }),
};
