import React from 'react';
import type { View } from '../../types';
import { LEGAL_NAV, MAIN_NAV, TRAINING_NAV, type NavItem } from './navItems';

interface SidebarProps {
  activeView: View;
  setView: (view: View) => void;
  isAdmin: boolean;
  isLoggedIn: boolean;
  userName: string | null;
  onUserLogout: () => void;
  isMobileOpen: boolean;
  onClose: () => void;
}

const NavList: React.FC<{ items: NavItem[]; isActive: (v: View) => boolean; onSelect: (v: View) => void }> = ({ items, isActive, onSelect }) => (
  <ul className="space-y-2">
    {items.map((item) => (
      <li key={item.view}>
        <button
          onClick={() => onSelect(item.view)}
          className={`w-full text-left flex items-center space-x-3 p-3 rounded-xl transition-all duration-300 ${
            isActive(item.view)
              ? 'gradient-red text-white font-semibold shadow-hover transform scale-105'
              : 'hover:bg-white/10 hover:translate-x-1'
          }`}
        >
          {item.icon}
          <span className="font-medium">{item.label}</span>
        </button>
      </li>
    ))}
  </ul>
);

export const Sidebar: React.FC<SidebarProps> = ({ activeView, setView, isAdmin, isLoggedIn, userName, onUserLogout, isMobileOpen, onClose }) => {
  const navItems = MAIN_NAV.filter(item => !item.requiresAdmin || isAdmin);
  // Event-Details gehören optisch zum Menüpunkt „Events“
  const isActive = (v: View) => activeView === v || (activeView === 'eventDetail' && v === 'events');

  const handleNavClick = (view: View) => {
    setView(view);
    onClose();
  };

  return (
    <>
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      <div className={`
        w-64 gradient-dark text-white p-5 flex flex-col h-screen fixed shadow-2xl z-50 overflow-y-auto
        transition-transform duration-300 ease-in-out
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
      <div className="mb-8 flex-shrink-0">
        <div className="flex items-center justify-center mb-4">
          <div className="relative w-28 h-28 rounded-full border border-primary bg-white p-1">
            <img 
              src="/logo.jpg" 
              alt="Skinfit Cup Logo" 
              className="w-full h-full object-contain rounded-full"
            />
          </div>
        </div>
        <h1 className="text-3xl font-display font-bold text-white text-center tracking-wide">
          SKINFIT<span className="text-primary">CUP</span>
        </h1>
      </div>
      
      <div className="lg:hidden flex justify-between items-center mb-4 flex-shrink-0">
        <h2 className="text-xl font-bold">Menü</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <nav className="flex-1 flex-shrink-0">
        <NavList items={navItems} isActive={isActive} onSelect={handleNavClick} />
        {/* Kategorie Training */}
        <div className="mt-4 pt-4 border-t border-white/20">
          <h3 className="px-3 mb-2 text-xs font-semibold uppercase tracking-widest text-white/50">Training</h3>
          <NavList items={TRAINING_NAV} isActive={isActive} onSelect={handleNavClick} />
        </div>
        {/* Legal / Info links */}
        <div className="mt-4 pt-4 border-t border-white/20">
          <ul className="space-y-1">
            {LEGAL_NAV.map((item) => (
              <li key={item.view}>
                <button
                  onClick={() => handleNavClick(item.view)}
                  className={`w-full text-left flex items-center space-x-3 p-2 rounded-lg text-sm transition-all duration-300 ${
                    activeView === item.view
                      ? 'gradient-red text-white font-semibold'
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </nav>
      
      <div className="mt-4 pt-4 border-t border-white/20 flex-shrink-0">
        {isLoggedIn ? (
          <div className="bg-white/10 rounded-lg p-3 mb-3">
            <div className="text-sm text-white/80 mb-2 text-center">{userName}</div>
            <button
              onClick={() => handleNavClick('userProfile')}
              className="w-full px-3 py-2 text-sm bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors mb-2"
            >
              Mein Profil
            </button>
            <button
              onClick={onUserLogout}
              className="w-full px-3 py-2 text-sm bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
            >
              Abmelden
            </button>
          </div>
        ) : (
          <button
            onClick={() => handleNavClick('userLogin')}
            className="w-full px-3 py-2 text-sm bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors flex items-center justify-center mb-3"
          >
            Anmelden / Registrieren
          </button>
        )}
        {isAdmin && (
          <div className="mt-2 px-3 py-1.5 text-xs text-center text-white/80 bg-white/10 rounded-lg uppercase tracking-wide">
            🔓 Admin-Modus
          </div>
        )}
      </div>
    </div>
    </>
  );
};
