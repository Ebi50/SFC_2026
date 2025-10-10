import React, { useMemo } from 'react';
import { Participant, Event, Result, Settings, GroupLabel, EventType, Team, TeamMember } from '../types';
import { calculateOverallStandings, Standing } from '../services/scoringService';
import { ChartBarIcon, DownloadIcon } from './icons';
import { exportStandingsToPDF } from '../services/exportService';

interface StandingsProps {
  participants: Participant[];
  events: Event[];
  results: Result[];
  settings: Settings;
  teams?: Team[];
  teamMembers?: TeamMember[];
}

interface StandingsTableProps {
  title: string;
  standings: Standing[];
  finishedEvents: Event[];
}

const getEventHeaderLabel = (event: Event): { date: string; type: string } => {
  const date = new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(event.date));
  
  const typeMap: Record<EventType, string> = {
    [EventType.EZF]: 'EZF',
    [EventType.BZF]: 'BZF',
    [EventType.MZF]: 'MZF',
    [EventType.Handicap]: 'HC',
  };
  
  return { date, type: typeMap[event.eventType] };
};


const StandingsTable: React.FC<StandingsTableProps> = ({ title, standings, finishedEvents }) => {
  const sortedStandings = useMemo(() => {
    if (!standings || !Array.isArray(standings)) return [];
    return [...standings].sort((a, b) => {
      const pointsDiff = (b.finalPoints ?? 0) - (a.finalPoints ?? 0);
      if (pointsDiff !== 0) return pointsDiff;
      
      for (let i = 0; i < Math.max(a.tieBreakerScores?.length || 0, b.tieBreakerScores?.length || 0); i++) {
        const scoreA = a.tieBreakerScores?.[i] || 0;
        const scoreB = b.tieBreakerScores?.[i] || 0;
        if (scoreB !== scoreA) {
          return scoreB - scoreA;
        }
      }
      
      return a.participantName.localeCompare(b.participantName);
    });
  }, [standings]);

  return (
    <div className="bg-white rounded-2xl shadow-card p-6 mb-8">
      <h3 className="text-2xl font-display font-bold text-dark-bg mb-4 border-b-2 border-primary pb-2">{title}</h3>
      <div className="max-h-[70vh] overflow-y-auto">
        <table className="w-full text-left">
          <thead className="gradient-dark sticky top-0 z-10">
            <tr>
              <th className="px-3 py-2 font-display font-semibold text-sm text-white uppercase tracking-wider whitespace-nowrap">Rang</th>
              <th className="px-3 py-2 font-display font-semibold text-sm text-white uppercase tracking-wider whitespace-nowrap min-w-[160px]">
                Name
              </th>
              {finishedEvents.map((event) => {
                const { date, type } = getEventHeaderLabel(event);
                return (
                  <th key={event.id} className="px-1 py-2 font-display font-semibold text-white text-center relative" title={event.name} style={{minWidth: '60px', width: '60px'}}>
                    <div className="flex items-center justify-center" style={{height: '90px'}}>
                      <div className="transform -rotate-45 origin-center whitespace-nowrap" style={{position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%) rotate(-45deg)'}}>
                        <div className="text-sm font-bold">{date}</div>
                        <div className="text-xs mt-0.5 opacity-90">{type}</div>
                      </div>
                    </div>
                  </th>
                );
              })}
              <th className="px-3 py-2 font-display font-semibold text-sm text-white uppercase tracking-wider text-right whitespace-nowrap">
                Gesamt
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedStandings.map((standing, index) => (
              <tr key={standing.participantId} className="hover:bg-primary/10">
                <td className="px-3 py-2 font-bold text-gray-800">{index + 1}.</td>
                <td className="px-3 py-2 text-gray-700">
                  <div>{standing.participantName}</div>
                  <div className="text-xs text-gray-500">Klasse: {standing.participantClass}</div>
                </td>
                {finishedEvents.map(event => {
                  const result = standing.results.find(r => r.eventId === event.id);
                  const points = result ? result.points : '-';
                  const isDropped = result?.isDropped;
                  
                  return (
                    <td key={event.id} className={`px-1 py-2 font-mono text-center ${isDropped ? 'text-gray-400' : 'text-gray-700'}`}>
                      {isDropped ? <s title="Streichergebnis">{points}</s> : points}
                    </td>
                  );
                })}
                <td className="px-3 py-2 font-mono text-right text-primary font-bold text-lg">{standing.finalPoints}</td>
              </tr>
            ))}
            {standings.length === 0 && (
              <tr>
                <td colSpan={3 + finishedEvents.length} className="p-4 text-center text-gray-500">
                  Keine Daten für diese Gruppe verfügbar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const Standings: React.FC<StandingsProps> = ({ participants, events, results, settings, teams = [], teamMembers = [] }) => {
  const groupedStandings = useMemo(
    () => calculateOverallStandings(results || [], participants || [], events || [], settings),
    [results, participants, events, settings]
  );

  const finishedEvents = useMemo(() => (events || []).filter(e => e.finished).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()), [events]);
  const currentSeason = useMemo(() => (events && events.length > 0) ? events[0].season : new Date().getFullYear(), [events]);


  const handleDownloadPDF = () => {
    try {
      exportStandingsToPDF(groupedStandings, finishedEvents, currentSeason);
    } catch (error) {
      console.error('PDF Export Error:', error);
      alert('Fehler beim PDF-Export. Bitte versuchen Sie es erneut.');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-3">
              <ChartBarIcon className="text-primary" />
              <h1 className="text-4xl font-display font-bold text-dark-bg">Gesamtwertung</h1>
          </div>
           <button
              onClick={handleDownloadPDF}
              className="gradient-dark text-white font-semibold py-3 px-6 rounded-xl flex items-center space-x-3 btn-hover shadow-card"
          >
              <DownloadIcon className="w-5 h-5" />
              <span>PDF Download</span>
          </button>
      </div>
      <p className="mb-8 text-gray-600">
        Die Gesamtwertung wird automatisch basierend auf den Ergebnissen der abgeschlossenen Rennen berechnet. 
        Streichergebnisse ({settings.dropScores}) werden berücksichtigt und sind durchgestrichen markiert.
      </p>

      <div className="grid grid-cols-1 gap-8">
        <StandingsTable title="Männer Ambitioniert (C/D)" standings={groupedStandings[GroupLabel.Ambitious]} finishedEvents={finishedEvents} />
        <StandingsTable title="Männer Hobby (A/B)" standings={groupedStandings[GroupLabel.Hobby]} finishedEvents={finishedEvents} />
        <StandingsTable title="Frauen" standings={groupedStandings[GroupLabel.Women]} finishedEvents={finishedEvents} />
      </div>
    </div>
  );
};