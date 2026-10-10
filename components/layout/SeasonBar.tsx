import React from 'react';

interface Props {
  seasons: number[];
  selected: number | null;
  onSelect: (season: number) => void;
  isAdmin: boolean;
  onNewSeason: () => void;
  onOpenMenu: () => void;
}

/** Kopfleiste: Menü-Knopf (mobil), Saisonauswahl und „Neue Saison“ für Admins */
export const SeasonBar: React.FC<Props> = ({ seasons, selected, onSelect, isAdmin, onNewSeason, onOpenMenu }) => (
  <div className="flex justify-between items-center mb-4 no-print">
    <button
      onClick={onOpenMenu}
      className="lg:hidden gradient-red text-white p-2 rounded-lg shadow-lg"
      aria-label="Menü öffnen"
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>
    <div className="flex-1 lg:flex-none"></div>
    <div className="flex items-center space-x-2 lg:space-x-4">
      <label htmlFor="season-select" className="font-bold text-gray-700 text-sm lg:text-xl">Saison:</label>
      <div className="relative inline-block">
        <select
          id="season-select"
          value={selected || ''}
          onChange={e => onSelect(Number(e.target.value))}
          className="block appearance-none bg-gradient-to-r from-gray-100 to-white w-40 lg:w-56 px-4 py-3 text-xl font-black text-gray-900 border-4 border-gray-300 rounded-xl shadow-xl hover:border-primary focus:border-primary focus:outline-none"
          style={{ textAlign: 'center', fontSize: '24px', letterSpacing: '0.05em' }}
        >
          {seasons.map(s => (
            <option
              key={s}
              value={s}
              style={{ fontSize: '24px', fontWeight: 900, padding: '12px', backgroundColor: 'white', color: '#1a202c' }}
            >
              {s}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4">
          <svg className="h-6 w-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {isAdmin && (
        <button
          onClick={onNewSeason}
          className="bg-secondary hover:bg-gray-700 text-white font-bold py-2 px-2 lg:px-4 rounded-lg flex items-center space-x-1 lg:space-x-2 transition-transform transform hover:scale-105 text-sm lg:text-base"
        >
          <span className="hidden lg:inline">Neue Saison</span>
          <span className="lg:hidden">+</span>
        </button>
      )}
    </div>
  </div>
);
