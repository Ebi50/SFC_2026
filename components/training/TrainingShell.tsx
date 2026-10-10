import React from 'react';
import { HealthNotice } from './TrainingNotices';

export interface Tab<K extends string> { key: K; label: string }

interface Props<K extends string> {
  subtitle: string;
  tabs: Tab<K>[];
  active: K;
  onTab: (k: K) => void;
  top?: React.ReactNode;
  children: React.ReactNode;
}

/** Gemeinsamer Rahmen für /training und /training/plan: Titel, Hinweise, Reiter */
export function TrainingShell<K extends string>({ subtitle, tabs, active, onTab, top, children }: Props<K>) {
  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-4">
      <div>
        <h1 className="text-4xl font-display font-bold text-dark-bg">Hüfte &amp; Rücken – Training</h1>
        <p className="text-gray-600 mt-1">{subtitle}</p>
      </div>
      <HealthNotice />
      {top}
      <div className="border-b border-gray-200 flex flex-wrap gap-1" role="tablist">
        {tabs.map(t => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={active === t.key}
            onClick={() => onTab(t.key)}
            className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
              active === t.key ? 'bg-white text-red-600 border-b-2 border-red-600 -mb-px' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div role="tabpanel">{children}</div>
    </div>
  );
}
