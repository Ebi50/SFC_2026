import React from 'react';
import { Settings, Participant, Event } from '../types';
import { CogIcon } from './icons';

interface TestSettingsViewProps {
  settings: Settings;
  onSettingsChange: (newSettings: Settings) => void;
  selectedSeason: number | null;
  participants: Participant[];
  events: Event[];
}

export const TestSettingsView: React.FC<TestSettingsViewProps> = ({ 
  settings, 
  onSettingsChange, 
  selectedSeason, 
  participants, 
  events 
}) => {
  console.log('TestSettingsView rendered with:', { settings, selectedSeason, participants: participants.length, events: events.length });

  return (
    <div className="p-6">
      <div className="flex items-center space-x-3 mb-6">
        <CogIcon />
        <h1 className="text-3xl font-bold text-secondary">Test Einstellungen</h1>
      </div>
      
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-secondary mb-4">Debug Info</h3>
        <div className="space-y-2">
          <p><strong>Selected Season:</strong> {selectedSeason}</p>
          <p><strong>Participants Count:</strong> {participants.length}</p>
          <p><strong>Events Count:</strong> {events.length}</p>
          <p><strong>Settings Loaded:</strong> {settings ? 'Yes' : 'No'}</p>
          <p><strong>Winner Points:</strong> {JSON.stringify(settings?.winnerPoints)}</p>
          <p><strong>Page Views:</strong> {settings?.pageViews || 0}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
        <h3 className="text-xl font-bold text-secondary mb-4">Test Button</h3>
        <button 
          onClick={() => {
            console.log('Test button clicked');
            alert('Settings component is working!');
          }}
          className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg"
        >
          Test Settings Component
        </button>
      </div>
    </div>
  );
};