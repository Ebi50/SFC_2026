import React from 'react';
import { Settings, Participant, Event } from '../types';
import { CogIcon } from './icons';

interface SettingsViewProps {
  settings: Settings;
  onSettingsChange: (newSettings: Settings) => void;
  selectedSeason: number | null;
  participants: Participant[];
  events: Event[];
}

export const MinimalSettingsView: React.FC<SettingsViewProps> = ({ 
  settings, 
  onSettingsChange, 
  selectedSeason, 
  participants, 
  events 
}) => {
  
  return (
    <div className="p-6">
      <div className="flex items-center space-x-3 mb-6">
        <CogIcon />
        <h1 className="text-3xl font-bold text-secondary">Einstellungen</h1>
      </div>
      
      {/* Basic Settings Display */}
      <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
        
        {/* Statistics */}
        <div>
          <h3 className="text-xl font-bold text-secondary mb-4 border-b pb-2">Statistiken</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Seitenbesuche gesamt</p>
              <p className="text-3xl font-bold text-primary">{settings?.pageViews || 0}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Teilnehmer gesamt</p>
              <p className="text-3xl font-bold text-primary">{participants?.length || 0}</p>
            </div>
          </div>
        </div>

        {/* Winner Points Settings */}
        <div>
          <h3 className="text-xl font-bold text-secondary mb-4 border-b pb-2">Zeitfahr-Wertung</h3>
          <div>
            <label className="block text-md font-medium text-gray-700 mb-2">Bonus-Punkte für Top-Platzierungen</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(settings?.winnerPoints || [3, 2, 1]).map((points, index) => (
                <div key={index}>
                  <label className="block text-sm font-medium text-gray-600">{index + 1}. Platz</label>
                  <input
                    type="number"
                    value={points}
                    min="0"
                    onChange={(e) => {
                      const newPoints = parseInt(e.target.value, 10) || 0;
                      const newWinnerPoints = [...(settings?.winnerPoints || [3, 2, 1])];
                      newWinnerPoints[index] = newPoints;
                      onSettingsChange({ ...settings, winnerPoints: newWinnerPoints });
                    }}
                    className="mt-1 p-2 w-full border border-gray-300 rounded-md"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Drop Scores Setting */}
        <div>
          <h3 className="text-xl font-bold text-secondary mb-4 border-b pb-2">Streichergebnisse</h3>
          <div>
            <label className="block text-md font-medium text-gray-700 mb-2">Anzahl der Streichergebnisse</label>
            <input
              type="number"
              value={settings?.dropScores || 1}
              min="0"
              onChange={(e) => {
                const dropScores = parseInt(e.target.value, 10) || 0;
                onSettingsChange({ ...settings, dropScores });
              }}
              className="p-2 border border-gray-300 rounded-md w-32"
            />
            <p className="text-sm text-gray-500 mt-1">Die schlechtesten Ergebnisse werden in der Gesamtwertung nicht berücksichtigt.</p>
          </div>
        </div>

        {/* Season Info */}
        <div>
          <h3 className="text-xl font-bold text-secondary mb-4 border-b pb-2">Saison-Information</h3>
          <div className="space-y-2">
            <p><strong>Aktuelle Saison:</strong> {selectedSeason || 'Keine ausgewählt'}</p>
            <p><strong>Events in dieser Saison:</strong> {events?.length || 0}</p>
            <p><strong>Teilnehmer gesamt:</strong> {participants?.length || 0}</p>
          </div>
        </div>

      </div>
    </div>
  );
};