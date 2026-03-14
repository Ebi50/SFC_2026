import React from 'react';
import { useAuth } from './AuthContext';

interface HomeViewProps {
  onManageContent: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onManageContent }) => {
  const { isAdmin } = useAuth();

  // Statischer Begrüßungstext aus index_with_link.html
  return (
    <>
      <div className="bg-gray-50 rounded-xl p-6 text-left border border-gray-200 mb-8">
        <header className="text-center py-6 bg-red-600 text-white rounded-t-xl -mx-6 -mt-6 mb-8">
          <h1 className="text-4xl font-extrabold tracking-wide">SKINFIT CUP</h1>
          <h2 className="text-lg mt-2 font-light">
            <a href="https://rsv-vaihingen.de/" target="_blank" rel="noopener noreferrer" className="underline hover:text-yellow-300 transition">
              RSV Stuttgart-Vaihingen
            </a>
          </h2>
        </header>
        <main className="space-y-10">
          <section>
            <h3 className="text-2xl font-semibold text-red-600 mb-3">Mehr als nur ein Training – ein Erlebnis für alle Radsportbegeisterten!</h3>
            <p className="text-base">Der <strong>SKINFIT Cup</strong> ist kein gewöhnliches Vereinstraining – er ist eine <strong>sportliche Herausforderung</strong> für alle, die ihre Leidenschaft für den Radsport leben, ihre Leistung testen und gemeinsam Grenzen verschieben möchten.</p>
            <p className="mt-4">Unterstützt vom <strong>SKINFIT-Shop Stuttgart</strong>, stehen bei uns <strong>Sicherheit, Spaß und Fairness</strong> an erster Stelle. Hier zählt nicht nur die Zeit auf der Uhr – sondern auch der Teamgeist auf der Strecke!</p>
          </section>
          <section>
            <h3 className="text-2xl font-semibold text-red-600 mb-3">Für alle, die den Radsport lieben</h3>
            <p className="text-base">Ob <strong>Hobbyfahrer</strong>, <strong>Senior</strong>, <strong>Gast</strong> oder <strong>Elite-Amateur</strong> – beim SKINFIT Cup ist jeder willkommen, der mindestens <strong>18 Jahre alt</strong> ist und Lust auf spannende Wettkämpfe hat. Jeder Teilnehmer wird gewertet – ganz gleich, ob du einfach Spaß haben oder dich mit Anderen messen möchtest.</p>
          </section>
          <section>
            <h3 className="text-2xl font-semibold text-red-600 mb-3">Vielfalt & Herausforderung</h3>
            <p className="text-base mb-4">Der SKINFIT Cup bietet abwechslungsreiche Trainingsrennen auf einer <strong>10-Kilometer-Runde</strong> sowie:</p>
            <ul className="list-disc pl-6 space-y-1 text-base">
              <li><strong>Einzelzeitfahren</strong> – Dein persönlicher Kampf gegen die Uhr</li>
              <li><strong>Mannschaftszeitfahren</strong> – Gemeinsam stark gegen den Wind</li>
              <li><strong>Bergzeitfahren</strong> – bei dem Kraft und Ausdauer zählen</li>
            </ul>
            <p className="mt-4">Jede Veranstaltung hat ihren eigenen Charakter – und jede Fahrt bringt dich ein Stück weiter nach vorn.</p>
          </section>
          <section className="bg-yellow-50 border-t border-yellow-200 p-6 rounded-lg shadow mt-8">
            <p className="text-base">Am Ende der Saison wird gefeiert! Die Besten sichern sich:</p>
            <ul className="list-disc pl-6 space-y-1 text-base mt-3">
              <li><strong>Pokale & Spitzenreitertrikots</strong></li>
              <li>den begehrten <strong>Gesamtsieg im Gelben Trikot</strong></li>
              <li>Auszeichnungen in den Kategorien <strong>Frauen</strong> und <strong>Hobbyfahrer</strong> für die Plätze <strong>1 bis 3</strong></li>
            </ul>
            <p className="mt-4 text-base">Ein Moment, den man nicht vergisst – voller Stolz, Emotion und Teamspirit!</p>
          </section>
          <section className="text-center py-6">
            <h3 className="text-2xl font-semibold text-red-600 mb-3">Gemeinschaft, Leidenschaft, Teamgeist</h3>
            <p className="text-base">Wir freuen uns auf eine spannende Saison voller Energie, Begeisterung und spannender Momente.<br />
              Werde Teil des SKINFIT Cups – <strong>wo Radsport lebt!</strong></p>
          </section>
        </main>
      </div>

      {/* Bilder/Videos Bereich */}
      <div className="bg-white rounded-2xl shadow-card p-8">
        <h3 className="text-2xl font-display font-bold text-secondary mb-6">
          Impressionen
        </h3>
        {/* Hier werden die Bilder/Videos angezeigt, z.B. als Platzhalter */}
        <div className="text-center text-gray-500 py-12">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p>Noch keine Bilder verfügbar</p>
        </div>
        {isAdmin && (
          <div className="text-center mt-6">
            <button
              onClick={onManageContent}
              className="bg-secondary hover:bg-gray-700 text-white font-bold py-3 px-8 rounded-lg inline-flex items-center space-x-2 transition-transform transform hover:scale-105"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span>Bilder verwalten</span>
            </button>
          </div>
        )}
      </div>
    </>
  );
};