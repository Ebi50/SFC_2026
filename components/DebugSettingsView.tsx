import React, { useState } from 'react';
import { Settings, AgeHandicapRule, PerfClass, Participant, Event } from '../types';
import { CogIcon, PlusIcon, TrashIcon, DownloadIcon } from './icons';

interface SettingsViewProps {
  settings: Settings;
  onSettingsChange: (newSettings: Settings) => void;
  selectedSeason: number | null;
  participants: Participant[];
  events: Event[];
}

export const DebugSettingsView: React.FC<SettingsViewProps> = ({ 
  settings, 
  onSettingsChange, 
  selectedSeason, 
  participants, 
  events 
}) => {
  console.log('DebugSettingsView props:', { settings, selectedSeason, participants: participants?.length, events: events?.length });

  // Test each critical section
  let perfClasses;
  try {
    perfClasses = [PerfClass.A, PerfClass.B, PerfClass.C, PerfClass.D];
    console.log('✅ PerfClass enum works:', perfClasses);
  } catch (error) {
    console.error('❌ PerfClass enum error:', error);
    return <div>Error with PerfClass enum: {String(error)}</div>;
  }

  // Test settings access
  try {
    const pageViews = settings?.pageViews || 0;
    const winnerPoints = settings?.winnerPoints || [];
    console.log('✅ Settings access works:', { pageViews, winnerPoints });
  } catch (error) {
    console.error('❌ Settings access error:', error);
    return <div>Error accessing settings: {String(error)}</div>;
  }

  // Test markdown generator import
  let markdownGenerator;
  try {
    const { generateProjectMarkdown } = require('../services/markdownGenerator');
    markdownGenerator = generateProjectMarkdown;
    console.log('✅ Markdown generator import works');
  } catch (error) {
    console.error('❌ Markdown generator import error:', error);
    return <div>Error importing markdown generator: {String(error)}</div>;
  }

  return (
    <div className="p-6">
      <div className="flex items-center space-x-3 mb-6">
        <CogIcon />
        <h1 className="text-3xl font-bold text-secondary">Debug Einstellungen</h1>
      </div>
      
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-secondary mb-4">All Tests Passed!</h3>
        <div className="space-y-2">
          <p>✅ PerfClass enum: {perfClasses.join(', ')}</p>
          <p>✅ Settings: {JSON.stringify(settings?.winnerPoints)}</p>
          <p>✅ Participants: {participants?.length || 0}</p>
          <p>✅ Events: {events?.length || 0}</p>
          <p>✅ Selected Season: {selectedSeason}</p>
          <p>✅ Markdown Generator: Available</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
        <button 
          onClick={() => {
            try {
              const content = markdownGenerator(participants, events, selectedSeason);
              console.log('✅ Markdown generation works, length:', content.length);
              alert('All components working correctly!');
            } catch (error) {
              console.error('❌ Markdown generation error:', error);
              alert('Markdown generation failed: ' + error);
            }
          }}
          className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg"
        >
          Test All Functions
        </button>
      </div>
    </div>
  );
};