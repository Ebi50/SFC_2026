import React, { useState, useEffect } from 'react';
import { Participant, Event, EventType } from '../types';
import { DocumentIcon } from './icons';
import { reglementApi } from '../services/api';

interface DashboardProps {
  selectedSeason: number | null;
  participants: Participant[];
  events: Event[];
}

const eventTypeLabels: Record<EventType, string> = {
  [EventType.EZF]: 'Einzelzeitfahren',
  [EventType.BZF]: 'Bergzeitfahren',
  [EventType.MZF]: 'Mannschaftszeitfahren',
  [EventType.Handicap]: 'Handicap-Rennen',
};

export const Dashboard: React.FC<DashboardProps> = ({ selectedSeason, participants, events }) => {
  const [reglementExists, setReglementExists] = useState(false);

  useEffect(() => {
    const checkReglement = async () => {
      try {
        const result = await reglementApi.exists();
        setReglementExists(result.exists);
      } catch (error) {
        console.error('Error checking reglement:', error);
      }
    };
    checkReglement();
  }, []);

  const handleViewReglement = () => {
    if (reglementExists) {
      window.open(reglementApi.getDownloadUrl(), '_blank');
    } else {
      alert('Es wurde noch kein Reglement hochgeladen. Bitte wenden Sie sich an den Administrator.');
    }
  };

  return (
    <div>
      <div className="text-gray-700 mb-8 text-lg">
        Willkommen beim Skinfit Cup! <br/>Verwaltungs- & Wertungsapp für die Saison <strong className="text-primary font-display">{selectedSeason}</strong>. Wählen Sie einen Menüpunkt, um zu starten.
      </div>

      <div className="mb-8">
        <button
          onClick={handleViewReglement}
          className={`font-semibold py-3 px-6 rounded-xl flex items-center space-x-3 btn-hover ${
            reglementExists 
              ? 'gradient-dark text-white shadow-card' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
          disabled={!reglementExists}
        >
          <DocumentIcon className="w-5 h-5" />
          <span>Reglement anzeigen</span>
        </button>
        {!reglementExists && (
          <p className="text-sm text-gray-500 mt-2">Kein Reglement verfügbar</p>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-card p-6">
        <h2 className="text-3xl font-display font-bold text-dark-bg mb-6">Geplante Events</h2>
        {events.length === 0 ? (
          <p className="text-gray-500">Noch keine Events für diese Saison geplant.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="gradient-dark">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-display font-semibold text-white uppercase tracking-wider">
                    Art des Events
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-display font-semibold text-white uppercase tracking-wider">
                    Datum
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-display font-semibold text-white uppercase tracking-wider">
                    Ort
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-display font-semibold text-white uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {events
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .map((event) => (
                    <tr key={event.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {eventTypeLabels[event.eventType]}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {new Date(event.date).toLocaleDateString('de-DE')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {event.location}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                          event.finished 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {event.finished ? 'Abgeschlossen' : 'Geplant'}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
