import React from 'react';
import { Participant, Event, GroupLabel, Gender, EventType } from '../types';
import { Standing } from '../services/scoringService';

interface PrintableReportProps {
    participants: Participant[];
    standings: Record<GroupLabel, Standing[]>;
    finishedEvents: Event[];
    season: number | null;
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

const StandingsTablePrint: React.FC<{ title: string; standings: Standing[]; finishedEvents: Event[]; }> = ({ title, standings, finishedEvents }) => (
    <div style={{ marginBottom: '2rem', breakBefore: 'page' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', borderBottom: '2px solid black', paddingBottom: '0.5rem', marginBottom: '1rem' }}>{title}</h3>
        {standings.length > 0 ? (
            <table style={{ 
                fontSize: '0.85rem', 
                width: '100%',
                borderCollapse: 'collapse',
                border: '1px solid black'
            }}>
                <thead>
                    <tr style={{ backgroundColor: '#1B1B1F', color: 'white' }}>
                        <th style={{ textAlign: 'left', padding: '6px 8px', border: '1px solid black' }}>Rang</th>
                        <th style={{ textAlign: 'left', padding: '6px 8px', minWidth: '140px', border: '1px solid black' }}>Name</th>
                        <th style={{ textAlign: 'left', padding: '6px 8px', border: '1px solid black' }}>Kl.</th>
                        {finishedEvents.map((event) => {
                            const { date, type } = getEventHeaderLabel(event);
                            return (
                                <th key={event.id} style={{ textAlign: 'center', padding: '6px 6px', fontSize: '0.75rem', border: '1px solid black' }}>
                                    <div>{date}</div>
                                    <div style={{ fontSize: '0.65rem', opacity: 0.9 }}>{type}</div>
                                </th>
                            );
                        })}
                        <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 'bold', border: '1px solid black' }}>Gesamt</th>
                    </tr>
                </thead>
                <tbody>
                    {standings.map((s, index) => (
                        <tr key={s.participantId} style={{ borderBottom: '1px solid black' }}>
                            <td style={{ padding: '6px 8px', fontWeight: 'bold', border: '1px solid black' }}>{index + 1}.</td>
                            <td style={{ padding: '6px 8px', border: '1px solid black' }}>{s.participantName}</td>
                            <td style={{ padding: '6px 8px', border: '1px solid black' }}>{s.participantClass}</td>
                            {finishedEvents.map(event => {
                                const result = s.results.find(r => r.eventId === event.id);
                                const points = result ? result.points : '-';
                                const isDropped = result?.isDropped;
                                
                                return (
                                    <td key={event.id} style={{ 
                                        textAlign: 'center', 
                                        padding: '6px 6px',
                                        border: '1px solid black',
                                        textDecoration: isDropped ? 'line-through' : 'none',
                                        color: isDropped ? '#666' : 'black'
                                    }}>
                                        {points}
                                    </td>
                                );
                            })}
                            <td style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 'bold', fontSize: '1rem', border: '1px solid black' }}>{s.finalPoints}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        ) : <p>Keine Teilnehmer in dieser Gruppe.</p>}
    </div>
);

export const PrintableReport: React.FC<PrintableReportProps> = ({ participants, standings, finishedEvents, season }) => {
    return (
        <div>
            <header style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Skinfit Cup {season}</h1>
                <p>Gesamtwertung (Stand: {new Date().toLocaleDateString('de-DE')})</p>
            </header>
            
            <main>
                <StandingsTablePrint title="Männer Ambitioniert (C/D)" standings={standings[GroupLabel.Ambitious]} finishedEvents={finishedEvents} />
                <StandingsTablePrint title="Männer Hobby (A/B)" standings={standings[GroupLabel.Hobby]} finishedEvents={finishedEvents} />
                <StandingsTablePrint title="Frauen" standings={standings[GroupLabel.Women]} finishedEvents={finishedEvents} />
            </main>
        </div>
    );
};
