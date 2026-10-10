import React from 'react';
import { HealthNotice } from './TrainingNotices';

export interface Tab<K extends string> { key: K; label: string }

interface Props<K extends string> {
  title: string;
  subtitle: string;
  tabs: Tab<K>[];
  active: K;
  onTab: (k: K) => void;
  top?: React.ReactNode;
  children: React.ReactNode;
}

/** Gemeinsamer Rahmen für /training und /training/plan – im Farbmuster der Startseite */
export function TrainingShell<K extends string>({ title, subtitle, tabs, active, onTab, top, children }: Props<K>) {
  return (
    <div className="bg-gray-50 rounded-xl p-4 sm:p-6 border border-gray-200 flex flex-col gap-5">
      <header className="text-center py-6 px-4 bg-red-600 text-white rounded-t-xl -mx-4 -mt-4 sm:-mx-6 sm:-mt-6">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-wide uppercase">{title}</h1>
        <p className="text-lg mt-2 font-light">{subtitle}</p>
      </header>
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
              active === t.key ? 'bg-white text-red-600 border-b-2 border-red-600 -mb-px' : 'text-gray-500 hover:text-gray-800 hover:bg-white'
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
