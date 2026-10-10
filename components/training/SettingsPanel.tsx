import React from 'react';
import type { TrainingSettings } from '../../lib/training/types';
import { SETTING_LIMITS } from '../../lib/training/schedule';
import { formatLong, isIsoDate, mondayOf, todayIso } from '../../lib/training/dates';
import { fmtSec } from './format';

interface Props {
  settings: TrainingSettings;
  onChange: (s: TrainingSettings) => void;
  cycleStart: string;
  onCycleStartChange: (iso: string) => void;
}

const SLIDERS: { key: keyof TrainingSettings; label: string; fmt: (v: number) => string }[] = [
  { key: 'dur', label: 'Gesamtdauer', fmt: v => `${v} min` },
  { key: 'rest', label: 'Pause zwischen Sätzen', fmt: fmtSec },
  { key: 'change', label: 'Wechsel zur nächsten Übung', fmt: fmtSec },
];

export const SettingsPanel: React.FC<Props> = ({ settings, onChange, cycleStart, onCycleStartChange }) => (
  <div className="grid sm:grid-cols-[auto_minmax(140px,220px)] gap-x-3 gap-y-1 items-center text-sm text-gray-600 flex-1 min-w-0">
    {SLIDERS.map(({ key, label, fmt }) => (
      <React.Fragment key={key}>
        <label htmlFor={`set-${key}`}>{label} <output className="font-bold text-secondary tabular-nums ml-1">{fmt(settings[key])}</output></label>
        <input
          id={`set-${key}`}
          type="range"
          min={SETTING_LIMITS[key].min}
          max={SETTING_LIMITS[key].max}
          step={5}
          value={settings[key]}
          onChange={e => onChange({ ...settings, [key]: Number(e.target.value) })}
          className="w-full accent-red-600 mb-1.5 sm:mb-0"
        />
      </React.Fragment>
    ))}
    <label htmlFor="set-cycle">Zyklusstart (Woche 1)</label>
    <div className="flex flex-wrap items-center gap-2">
      <input
        id="set-cycle"
        type="date"
        value={cycleStart}
        onChange={e => isIsoDate(e.target.value) && onCycleStartChange(e.target.value)}
        className="border border-gray-300 rounded-md px-2 py-1 text-secondary"
        title={formatLong(cycleStart)}
      />
      <button type="button" onClick={() => onCycleStartChange(mondayOf(todayIso()))} className="underline text-gray-600 hover:text-primary">
        auf diese Woche zurücksetzen
      </button>
    </div>
  </div>
);
