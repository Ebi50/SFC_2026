import React, { useState } from 'react';

type TechnikTab = 'reifendruck';

interface TabDef {
  id: TechnikTab;
  label: string;
  iframeSrc: string;
  iframeTitle: string;
}

const TABS: TabDef[] = [
  {
    id: 'reifendruck',
    label: 'Reifendruck-Kalkulator',
    iframeSrc: '/reifendruck-kalkulator.html',
    iframeTitle: 'Reifendruck-Kalkulator',
  },
];

export const TechnikView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TechnikTab>('reifendruck');
  const current = TABS.find(t => t.id === activeTab) ?? TABS[0];

  return (
    <div className="h-full">
      <div className="mb-6">
        <h1 className="text-4xl font-display font-bold text-dark-bg flex items-center">
          <svg className="w-8 h-8 mr-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Technik
        </h1>
        <p className="text-gray-600 mt-2">Werkzeuge rund ums Rennrad</p>
      </div>

      <div className="border-b border-gray-200 mb-4 flex flex-wrap gap-1">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-red-600 border-b-2 border-red-600 -mb-px'
                : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden" style={{ height: 'calc(100vh - 240px)' }}>
        <iframe
          key={current.id}
          src={current.iframeSrc}
          className="w-full h-full"
          title={current.iframeTitle}
          style={{ border: 'none' }}
        />
      </div>
    </div>
  );
};
